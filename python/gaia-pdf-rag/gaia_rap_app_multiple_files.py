import json
import os
import tempfile
from typing import List, Dict, Tuple

import requests
import streamlit as st
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams
from sentence_transformers import CrossEncoder, SentenceTransformer
from streamlit.runtime.uploaded_file_manager import UploadedFile

# Configuration
GAIA_NODE_URL = "http://localhost:8080/v1"
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
COLLECTION_NAME = "pdf_documents"
VECTOR_SIZE = 384  # Size of embeddings from all-MiniLM-L6-v2 model

system_prompt = """
You are an AI assistant tasked with providing detailed answers based solely on the given context. Your goal is to analyze the information provided and formulate a comprehensive, well-structured response to the question.

Context and question will be provided in the following format:
Context: <context text>
Question: <question text>

To answer the question:
1. Thoroughly analyze the context, identifying key information relevant to the question
2. Organize your thoughts and plan your response to ensure a logical flow
3. Formulate a detailed answer using only information from the context
4. Be comprehensive while staying focused on the question
5. If context lacks sufficient information, clearly state this

Important: Base your response solely on the provided context. Do not include external knowledge.
"""

@st.cache_resource
def get_embedding_model():
    """Initialize and cache the sentence transformer model"""
    return SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

@st.cache_resource
def get_qdrant_client():
    """Initialize and cache the Qdrant client"""
    return QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def init_collection(client: QdrantClient):
    """Initialize Qdrant collection if it doesn't exist or has wrong dimensions"""
    try:
        # Try to get collection info
        collection_info = client.get_collection(COLLECTION_NAME)
        
        # Check if dimensions match
        current_size = collection_info.config.params.vectors.size
        if current_size != VECTOR_SIZE:
            # Delete and recreate if dimensions don't match
            st.warning(f"Recreating collection due to dimension mismatch (current: {current_size}, required: {VECTOR_SIZE})")
            client.delete_collection(COLLECTION_NAME)
            raise Exception("Collection deleted due to dimension mismatch")
    except Exception:
        # Create new collection
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )

def process_document(uploaded_file: UploadedFile) -> List[Document]:
    """Process uploaded PDF file into text chunks."""
    temp_file = tempfile.NamedTemporaryFile("wb", suffix=".pdf", delete=False)
    temp_file.write(uploaded_file.read())
    temp_file.close()

    try:
        loader = PyMuPDFLoader(temp_file.name)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,
            chunk_overlap=100,
            separators=["\n\n", "\n", ".", "?", "!", " ", ""],
        )
        splits = text_splitter.split_documents(docs)
        return splits
    except Exception as e:
        st.error(f"Error processing {uploaded_file.name}: {str(e)}")
        return []
    finally:
        os.unlink(temp_file.name)

def process_multiple_documents(uploaded_files: List[UploadedFile]) -> Dict[str, List[Document]]:
    """Process multiple uploaded PDF files into text chunks."""
    all_documents = {}
    with st.status("Processing documents...") as status:
        total_files = len(uploaded_files)
        for idx, file in enumerate(uploaded_files, 1):
            status.update(label=f"Processing {file.name} ({idx}/{total_files})")
            splits = process_document(file)
            if splits:  # Only add if processing was successful
                all_documents[file.name] = splits
                status.update(label=f"✅ Processed {file.name} ({idx}/{total_files})")
            else:
                status.update(label=f"❌ Failed to process {file.name} ({idx}/{total_files})")
    
    return all_documents

def add_documents_to_vector_db(documents: Dict[str, List[Document]]):
    """Add multiple documents to Qdrant vector database."""
    client = get_qdrant_client()
    init_collection(client)
    model = get_embedding_model()
    
    # Get current count to start new IDs after existing ones
    try:
        collection_info = client.get_collection(COLLECTION_NAME)
        start_id = collection_info.points_count
    except:
        start_id = 0
    
    current_id = start_id
    total_chunks = sum(len(chunks) for chunks in documents.values())
    
    with st.status("Adding documents to vector store...") as status:
        for file_name, splits in documents.items():
            points = []
            for split in splits:
                # Create embedding for the text
                vector = model.encode(split.page_content)
                
                # Create Qdrant point
                point = models.PointStruct(
                    id=current_id,
                    vector=vector.tolist(),
                    payload={
                        "text": split.page_content,
                        "metadata": split.metadata,
                        "file_name": file_name
                    }
                )
                points.append(point)
                current_id += 1
                
                # Update progress
                progress = (current_id - start_id) / total_chunks
                status.update(label=f"Processing {file_name}: {progress:.0%} complete")
            
            # Upsert points in batches
            batch_size = 100
            try:
                for i in range(0, len(points), batch_size):
                    batch = points[i:i + batch_size]
                    client.upsert(
                        collection_name=COLLECTION_NAME,
                        points=batch
                    )
            except Exception as e:
                st.error(f"Error adding {file_name} to vector database: {str(e)}")
                continue
            
            status.update(label=f"✅ Added {file_name} to vector store")
    
    st.success(f"✅ Successfully added {total_chunks} chunks from {len(documents)} documents to vector store!")

def query_vector_db(prompt: str, n_results: int = 10) -> List[Dict]:
    """Query Qdrant for relevant documents."""
    client = get_qdrant_client()
    model = get_embedding_model()
    
    # Create embedding for the query
    query_vector = model.encode(prompt)
    
    # Search for similar vectors
    results = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector.tolist(),
        limit=n_results
    )
    
    # Extract texts and metadata from results
    search_results = []
    for hit in results:
        search_results.append({
            "text": hit.payload["text"],
            "file_name": hit.payload["file_name"],
            "metadata": hit.payload["metadata"],
            "score": hit.score
        })
    return search_results

def parse_gaia_stream(response_text: str) -> str:
    """Parse the streaming response from Gaia node."""
    try:
        response_json = json.loads(response_text)
        if "choices" in response_json and len(response_json["choices"]) > 0:
            delta = response_json["choices"][0].get("delta", {})
            return delta.get("content", "")
    except json.JSONDecodeError:
        return ""
    return ""

def call_gaia_llm(context: str, prompt: str):
    """Call local Gaia node for chat completion."""
    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user", 
            "content": f"Context: {context}\nQuestion: {prompt}"
        }
    ]
    
    response = requests.post(
        f"{GAIA_NODE_URL}/chat/completions",
        json={
            "messages": messages,
            "stream": True
        },
        stream=True
    )
    
    if response.status_code != 200:
        raise Exception(f"Error from Gaia node: {response.text}")
        
    # Process the SSE stream
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data = line[6:]  # Remove 'data: ' prefix
                if data != '[DONE]':
                    content = parse_gaia_stream(data)
                    if content:
                        yield content

def re_rank_search_results(prompt: str, search_results: List[Dict]) -> Tuple[str, List[Dict]]:
    """Re-rank search results using cross-encoder model."""
    encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    
    # Extract texts for ranking
    texts = [result["text"] for result in search_results]
    
    # Get rankings
    ranks = encoder.rank(prompt, texts, top_k=3)
    
    # Compile relevant text and keep track of sources
    relevant_text = ""
    relevant_results = []
    
    for rank in ranks:
        relevant_text += texts[rank["corpus_id"]]
        relevant_results.append(search_results[rank["corpus_id"]])
    
    return relevant_text, relevant_results

def main():
    st.set_page_config(
        page_title="Gaia RAG Demo",
        layout="wide"
    )
    
    with st.sidebar:
        st.title("📑 Document Upload")
        uploaded_files = st.file_uploader(
            "Upload PDF files",
            type=["pdf"],
            accept_multiple_files=True
        )

        if uploaded_files:
            process = st.button("⚡ Process Documents")
            if process:
                # Process all uploaded documents
                document_splits = process_multiple_documents(uploaded_files)
                
                # Only proceed with vector storage if we have successful splits
                if document_splits:
                    add_documents_to_vector_db(document_splits)
                else:
                    st.error("No documents were successfully processed")

    st.title("🤖 Gaia RAG Assistant")
    st.caption("Ask questions about your uploaded documents")
    
    # Initialize chat state
    if 'full_response' not in st.session_state:
        st.session_state.full_response = ""
    if 'relevant_results' not in st.session_state:
        st.session_state.relevant_results = []

    # Create two columns for the chat interface
    col1, col2 = st.columns([2, 1])
    
    with col1:
        prompt = st.text_area("Your question:")
        ask = st.button("🔍 Ask")

        if ask and prompt:
            with st.spinner("Searching knowledge base..."):
                # Get relevant documents
                search_results = query_vector_db(prompt)
                
                if not search_results:
                    st.write("I don't have any relevant information to answer your question.")
                    return
                
                # Re-rank and check relevance
                relevant_text, relevant_results = re_rank_search_results(prompt, search_results)
                st.session_state.relevant_results = relevant_results
                
                # Check if the most relevant document is actually relevant
                cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
                relevance_score = cross_encoder.predict([(prompt, relevant_results[0]["text"])])[0]
                
                if relevance_score < 0.5:  # Threshold for relevance
                    st.write("I'm sorry but I don't have relevant information to answer this question accurately.")
                    return
                    
                # Display response
                st.write("### Answer:")
                response_container = st.empty()
                st.session_state.full_response = ""
                
                try:
                    # Stream response
                    for chunk in call_gaia_llm(relevant_text, prompt):
                        if chunk:
                            st.session_state.full_response += chunk
                            response_container.markdown(st.session_state.full_response)
                    
                except Exception as e:
                    st.error(f"Error getting response from Gaia node: {str(e)}")
        
        # Display existing response if it exists
        if st.session_state.full_response:
            st.markdown(st.session_state.full_response)
    
    # Show sources in the second column
    with col2:
        if st.session_state.full_response and not "I don't have relevant information" in st.session_state.full_response:
            st.markdown("### 📚 Source Documents")
            for idx, result in enumerate(st.session_state.relevant_results, 1):
                with st.expander(f"Source {idx} - {result['file_name']}"):
                    st.markdown(f"**Page {result['metadata'].get('page', 'Unknown')}**")
                    st.markdown(result["text"])
                    st.markdown(f"Relevance Score: {result['score']:.2f}")

if __name__ == "__main__":
    main()