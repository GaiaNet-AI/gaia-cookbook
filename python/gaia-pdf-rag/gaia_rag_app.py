import json
import os
import tempfile
from typing import List, Tuple

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

    loader = PyMuPDFLoader(temp_file.name)
    docs = loader.load()
    os.unlink(temp_file.name)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=100,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""],
    )
    return text_splitter.split_documents(docs)

def add_to_vector_db(all_splits: List[Document], file_name: str):
    """Add document splits to Qdrant vector database."""
    client = get_qdrant_client()
    init_collection(client)
    model = get_embedding_model()
    
    points = []
    for idx, split in enumerate(all_splits):
        # Create embedding for the text
        vector = model.encode(split.page_content)
        
        # Create Qdrant point
        point = models.PointStruct(
            id=idx,  # Use simple incrementing IDs
            vector=vector.tolist(),
            payload={
                "text": split.page_content,
                "metadata": split.metadata,
                "file_name": file_name
            }
        )
        points.append(point)
    
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
        st.error(f"Error adding documents to vector database: {str(e)}")
        raise
    
    st.success("✅ Documents added to vector store!")

def query_vector_db(prompt: str, n_results: int = 10) -> List[str]:
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
    
    # Extract texts from results
    texts = [hit.payload["text"] for hit in results]
    return texts

def parse_gaia_stream(response_text: str) -> str:
    """Parse the streaming response from Gaia node."""
    try:
        # Split the response into separate JSON objects
        response_json = json.loads(response_text)
        
        # Extract the content from the response
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

def re_rank_cross_encoders(prompt: str, documents: List[str]) -> Tuple[str, List[int]]:
    """Re-rank documents using cross-encoder model."""
    relevant_text = ""
    relevant_text_ids = []
    
    encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    ranks = encoder.rank(prompt, documents, top_k=3)
    
    for rank in ranks:
        relevant_text += documents[rank["corpus_id"]]
        relevant_text_ids.append(rank["corpus_id"])
    
    return relevant_text, relevant_text_ids

def main():
    st.set_page_config(page_title="Gaia RAG Demo")
    
    with st.sidebar:
        st.title("📑 Document Upload")
        uploaded_file = st.file_uploader(
            "Upload PDF file",
            type=["pdf"],
            accept_multiple_files=False
        )

        if uploaded_file:
            process = st.button("⚡ Process Document")
            if process:
                with st.spinner("Processing document..."):
                    file_name = uploaded_file.name.translate(
                        str.maketrans({"-": "_", ".": "_", " ": "_"})
                    )
                    splits = process_document(uploaded_file)
                    add_to_vector_db(splits, file_name)

    st.title("🤖 Gaia RAG Assistant")
    st.caption("Ask questions about your uploaded documents")
    
    prompt = st.text_area("Your question:")
    ask = st.button("🔍 Ask")

    if ask and prompt:
        with st.spinner("Searching knowledge base..."):
            # Get relevant documents
            documents = query_vector_db(prompt)
            
            if not documents:
                st.write("I don't have any relevant information to answer your question.")
                return
            
            # Re-rank and check relevance
            relevant_text, relevant_ids = re_rank_cross_encoders(prompt, documents)
            
            # Check if the most relevant document is actually relevant
            cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            relevance_score = cross_encoder.predict([(prompt, documents[relevant_ids[0]])])[0]
            
            if relevance_score < 0.5:  # Threshold for relevance
                st.write("I'm sorry but I do not have the capability to perform this task for you. I am happy to help you with any other queries you may have.")
                return
                
            # Display response
            st.write("### Answer:")
            response_container = st.empty()
            full_response = ""
            
            try:
                # Stream response
                for chunk in call_gaia_llm(relevant_text, prompt):
                    if chunk:
                        full_response += chunk
                        response_container.markdown(full_response)
                
                # Only show sources if we got a valid response
                if full_response and not "I do not have the capability" in full_response:
                    with st.expander("📚 Source Documents"):
                        st.write("Most relevant passages used to generate the answer:")
                        for idx in relevant_ids:
                            st.markdown(f"**Passage {idx + 1}:**")
                            st.markdown(documents[idx])
                            st.markdown("---")
                            
            except Exception as e:
                st.error(f"Error getting response from Gaia node: {str(e)}")

if __name__ == "__main__":
    main()