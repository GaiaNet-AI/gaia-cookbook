"""
An example of using Chroma DB and LangChain with Gaia Node (OpenAI compatible API) 
for question answering over documents, with local persistence.
This showcases how to use Gaia with Chroma as an alternative to the default Qdrant setup.

Required packages:
pip install langchain-community langchain-openai chromadb
"""

from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, OpenAI, ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAI
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import TextLoader
import os

# Configuration for Gaia Node
GAIA_NODE_URL = "https://0x5ee30a31554672a0c213ed38e8898de84c2bb34b.gaia.domains"  # Replace with your Gaia node URL
GAIA_API_KEY = "gaia"  # Replace with your Gaia API key

# Set up environment variables for OpenAI-compatible API
os.environ["OPENAI_API_BASE"] = f"{GAIA_NODE_URL}/v1"
os.environ["OPENAI_API_KEY"] = GAIA_API_KEY

def load_and_process_documents(file_path):
    """Load and split documents into chunks for processing."""
    print(f"Loading document: {file_path}")
    
    # Load the document
    loader = TextLoader(file_path)
    documents = loader.load()
    
    # Split into chunks for better retrieval
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200  # Added overlap for better context
    )
    texts = text_splitter.split_documents(documents)
    
    print(f"Document split into {len(texts)} chunks")
    return texts

def create_vector_database(texts, persist_directory='gaia_chroma_db'):
    """Create and persist Chroma vector database with Gaia embeddings."""
    print("Creating embeddings using Gaia Node...")
    
    # Initialize embeddings with Gaia Node endpoint
    embedding = OpenAIEmbeddings(
        base_url=os.environ["OPENAI_API_BASE"],
        api_key=os.environ["OPENAI_API_KEY"],
        model="Nomic-embed-text-v1.5" 
    )
    
    # Create vector database
    vectordb = Chroma.from_documents(
        documents=texts, 
        embedding=embedding, 
        persist_directory=persist_directory
    )
    
    print(f"Vector database created with {len(texts)} documents")
    return vectordb, embedding

def load_existing_database(persist_directory='gaia_chroma_db'):
    """Load existing Chroma database from disk."""
    print(f"Loading existing database from {persist_directory}")
    
    # Initialize embeddings (must match the ones used during creation)
    embedding = OpenAIEmbeddings(
        base_url=os.environ["OPENAI_API_BASE"],
        api_key=os.environ["OPENAI_API_KEY"],
        model="Nomic-embed-text-v1.5"
    )
    
    # Load persisted database
    vectordb = Chroma(
        persist_directory=persist_directory, 
        embedding_function=embedding
    )
    
    print("Database loaded successfully")
    return vectordb, embedding

def create_qa_chain(vectordb):
    """Create question-answering chain using Gaia Node LLM."""
    print("Initializing QA chain with Gaia Node...")
    
    llm = ChatOpenAI(
        base_url=os.environ["OPENAI_API_BASE"],
        api_key=os.environ["OPENAI_API_KEY"],
        model="Llama-3-Groq-8B-Tool-Use-Q5_K_M",
        temperature=0.7
    )
    
    # Create QA chain using RetrievalQA
    qa = RetrievalQA.from_chain_type(
        llm=llm, 
        chain_type="stuff", 
        retriever=vectordb.as_retriever(),
        return_source_documents=True  # Include source documents in response
    )
    
    print("QA chain created successfully")
    return qa

def main():
    """Main function demonstrating the complete workflow."""
    
    # Configuration
    document_path = 'state_of_the_union.txt'  # Replace with your document
    persist_directory = 'gaia_chroma_db'
    
    print("=== Document QA with Gaia Node and Chroma DB ===\n")
    
    try:
        # Check if database already exists
        if os.path.exists(persist_directory):
            print("Existing database found. Loading from disk...")
            vectordb, embedding = load_existing_database(persist_directory)
        else:
            print("Creating new database...")
            # Load and process documents
            texts = load_and_process_documents(document_path)
            
            # Create vector database
            vectordb, embedding = create_vector_database(texts, persist_directory)
            
            # Persist the database
            print("Persisting database to disk...")
            vectordb.persist()
        
        # Create QA chain
        qa = create_qa_chain(vectordb)
        
        # Example queries
        queries = [
            "What did the president say about Ketanji Brown Jackson?",
            "What were the main economic points mentioned?",
            "What was said about international relations?"
        ]
        
        print("\n=== Question Answering Demo ===")
        for query in queries:
            print(f"\nQuery: {query}")
            print("-" * 50)
            
            try:
                result = qa.invoke({"query": query})
                print(f"Answer: {result['result']}")
                
                # Show source documents if available
                if 'source_documents' in result:
                    print(f"\nSources used: {len(result['source_documents'])} documents")
                    for i, doc in enumerate(result['source_documents'][:2]):  # Show first 2 sources
                        print(f"Source {i+1}: {doc.page_content[:100]}...")
                        
            except Exception as e:
                print(f"Error processing query: {e}")
        
        # Cleanup option
        print("\n=== Cleanup ===")
        cleanup = input("Delete database? (y/n): ").lower().strip()
        if cleanup == 'y':
            vectordb.delete_collection()
            vectordb.persist()
            print("Database collection deleted")
            
            # Remove directory
            import shutil
            if os.path.exists(persist_directory):
                shutil.rmtree(persist_directory)
                print(f"Directory {persist_directory} removed")
    
    except Exception as e:
        print(f"Error in main execution: {e}")
        print("Please check your Gaia Node configuration and ensure it's running")

      
def test_gaia_connection():
    """Test connection to Gaia Node."""
    print("Testing Gaia Node connection...")
    
    try:
        # Test embeddings
        embedding = OpenAIEmbeddings(
            base_url=os.environ["OPENAI_API_BASE"],
            api_key=os.environ["OPENAI_API_KEY"],
            model="Nomic-embed-text-v1.5"
        )
        
        test_text = "This is a test sentence."
        result = embedding.embed_query(test_text)
        print(f"✓ Embeddings working - dimension: {len(result)}")
        
        # Test LLM with ChatOpenAI for chat models
        llm = ChatOpenAI( # Changed from OpenAI to ChatOpenAI
            base_url=os.environ["OPENAI_API_BASE"],
            api_key=os.environ["OPENAI_API_KEY"],
            model="Llama-3-Groq-8B-Tool-Use-Q5_K_M"
        )
        
        response = llm.invoke("Say hello!")
        # FIX: Access the 'content' attribute of the AIMessage object
        print(f"✓ LLM working - response: {response.content[:50]}...") 
        
        return True
        
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        return False

if __name__ == "__main__":
    print("Gaia Node + Chroma DB Integration")
    print("=" * 40)
    
    # Test connection first
    if test_gaia_connection():
        print("\nGaia Node connection successful!")
        main()
    else:
        print("\nPlease configure your Gaia Node settings and try again.")
        print("Update GAIA_NODE_URL and GAIA_API_KEY variables at the top of this script.")