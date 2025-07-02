#!/usr/bin/env python3
"""
Gaia Node + Weaviate Integration with Environment Configuration

This version uses .env file for all configuration values, making it
production-ready and easy to manage across different environments.

Prerequisites:
1. Create a .env file with your configuration
2. Install dependencies: pip install openai weaviate-client python-dotenv requests
"""

import os
import json
import time
from typing import List, Dict, Any, Optional
import requests
import weaviate
from weaviate.classes.config import Configure, Property, DataType
from weaviate.classes.query import Filter
from weaviate.classes.init import Auth
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Configuration class that loads all settings from environment variables."""
    
    def __init__(self):
        # Gaia Node Configuration
        self.GAIA_BASE_URL = os.getenv('GAIA_BASE_URL', 'http://localhost:8080/v1')
        self.GAIA_API_KEY = os.getenv('GAIA_API_KEY', 'test-key')
        self.GAIA_MODEL_NAME = os.getenv('GAIA_MODEL_NAME', 'llama-3.2-3b-instruct')
        
        # Weaviate Configuration
        self.WEAVIATE_HOST = os.getenv('WEAVIATE_HOST', 'localhost')
        self.WEAVIATE_PORT = int(os.getenv('WEAVIATE_PORT', '8080'))
        self.WEAVIATE_API_KEY = os.getenv('WEAVIATE_API_KEY', '')
        self.WEAVIATE_USE_AUTH = os.getenv('WEAVIATE_USE_AUTH', 'false').lower() == 'true'
        
        # Collection Configuration
        self.DEFAULT_COLLECTION_NAME = os.getenv('DEFAULT_COLLECTION_NAME', 'MyKnowledgeBase')
        self.VECTORIZER_MODULE = os.getenv('VECTORIZER_MODULE', 'text2vec-transformers')
        
        # Generation Parameters
        self.MAX_TOKENS = int(os.getenv('MAX_TOKENS', '300'))
        self.TEMPERATURE = float(os.getenv('TEMPERATURE', '0.7'))
        self.SEARCH_LIMIT = int(os.getenv('SEARCH_LIMIT', '3'))
        
        # Optional API Keys
        self.OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
        self.COHERE_API_KEY = os.getenv('COHERE_API_KEY', '')
        self.HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY', '')
        
        # Debug and Performance
        self.DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
        self.LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
        self.BATCH_SIZE = int(os.getenv('BATCH_SIZE', '100'))
        self.CONNECTION_TIMEOUT = int(os.getenv('CONNECTION_TIMEOUT', '30'))
        self.REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', '60'))
    
    def validate(self):
        """Validate required configuration values."""
        errors = []
        
        if not self.GAIA_BASE_URL:
            errors.append("GAIA_BASE_URL is required")
        
        if not self.WEAVIATE_HOST:
            errors.append("WEAVIATE_HOST is required")
            
        if self.WEAVIATE_USE_AUTH and not self.WEAVIATE_API_KEY:
            errors.append("WEAVIATE_API_KEY is required when WEAVIATE_USE_AUTH is true")
        
        if errors:
            raise ValueError("Configuration errors:\n" + "\n".join(f"- {error}" for error in errors))
    
    def get_weaviate_headers(self):
        """Get additional headers for Weaviate based on configured API keys."""
        headers = {}
        
        if self.OPENAI_API_KEY:
            headers["X-OpenAI-Api-Key"] = self.OPENAI_API_KEY
        
        if self.COHERE_API_KEY:
            headers["X-Cohere-Api-Key"] = self.COHERE_API_KEY
            
        if self.HUGGINGFACE_API_KEY:
            headers["X-HuggingFace-Api-Key"] = self.HUGGINGFACE_API_KEY
        
        return headers
    
    def get_vectorizer_config(self):
        """Get vectorizer configuration based on the selected module."""
        if self.VECTORIZER_MODULE == 'text2vec-openai':
            if not self.OPENAI_API_KEY:
                print("⚠️ Warning: text2vec-openai requires OPENAI_API_KEY. Falling back to text2vec-transformers")
                return Configure.Vectorizer.text2vec_transformers()
            return Configure.Vectorizer.text2vec_openai()
        
        elif self.VECTORIZER_MODULE == 'text2vec-cohere':
            if not self.COHERE_API_KEY:
                print("⚠️ Warning: text2vec-cohere requires COHERE_API_KEY. Falling back to text2vec-transformers")
                return Configure.Vectorizer.text2vec_transformers()
            return Configure.Vectorizer.text2vec_cohere()
        
        elif self.VECTORIZER_MODULE == 'text2vec-huggingface':
            return Configure.Vectorizer.text2vec_huggingface()
        
        else:  # Default to text2vec-transformers
            return Configure.Vectorizer.text2vec_transformers()
    
    def print_config(self):
        """Print current configuration (without sensitive data)."""
        print("🔧 Current Configuration:")
        print(f"  Gaia URL: {self.GAIA_BASE_URL}")
        print(f"  Gaia API Key: {'***' if self.GAIA_API_KEY else 'Not set'}")
        print(f"  Weaviate: {self.WEAVIATE_HOST}:{self.WEAVIATE_PORT}")
        print(f"  Weaviate Auth: {self.WEAVIATE_USE_AUTH}")
        print(f"  Collection: {self.DEFAULT_COLLECTION_NAME}")
        print(f"  Vectorizer: {self.VECTORIZER_MODULE}")
        print(f"  Max Tokens: {self.MAX_TOKENS}")
        print(f"  Temperature: {self.TEMPERATURE}")
        print(f"  Debug: {self.DEBUG}")


def test_configuration():
    """Test if the current configuration works."""
    print("🧪 Testing Configuration from .env")
    print("=" * 50)
    
    config = Config()
    config.print_config()
    
    try:
        config.validate()
        print("✅ Configuration validation passed")
    except ValueError as e:
        print(f"❌ Configuration validation failed:\n{e}")
        return None
    
    # Test Gaia connection
    print(f"\n1️⃣ Testing Gaia connection...")
    try:
        client = openai.OpenAI(
            base_url=config.GAIA_BASE_URL,
            api_key=config.GAIA_API_KEY,
            timeout=config.REQUEST_TIMEOUT
        )
        
        models = client.models.list()
        model_names = [model.id for model in models.data]
        print(f"✅ Gaia connected! Models: {model_names}")
        gaia_working = True
        
    except Exception as e:
        print(f"❌ Gaia connection failed: {e}")
        gaia_working = False
    
    # Test Weaviate connection
    print(f"\n2️⃣ Testing Weaviate connection...")
    try:
        auth_config = None
        if config.WEAVIATE_USE_AUTH and config.WEAVIATE_API_KEY:
            auth_config = Auth.api_key(config.WEAVIATE_API_KEY)
        
        weaviate_client = weaviate.connect_to_local(
            host=config.WEAVIATE_HOST,
            port=config.WEAVIATE_PORT,
            auth_credentials=auth_config,
            headers=config.get_weaviate_headers()
        )
        
        is_ready = weaviate_client.is_ready()
        print(f"✅ Weaviate connected! Ready: {is_ready}")
        
        collections = weaviate_client.collections.list_all()
        print(f"✅ Existing collections: {list(collections.keys())}")
        
        weaviate_client.close()
        weaviate_working = True
        
    except Exception as e:
        print(f"❌ Weaviate connection failed: {e}")
        weaviate_working = False
    
    return gaia_working and weaviate_working


class GaiaWeaviateIntegration:
    """
    Production-ready Gaia + Weaviate integration using environment configuration.
    """
    
    def __init__(self, config: Config = None):
        """Initialize with configuration from environment variables."""
        self.config = config or Config()
        self.config.validate()
        
        if self.config.DEBUG:
            print("🔧 Initializing Gaia + Weaviate Integration")
            self.config.print_config()
        
        # Initialize OpenAI client with Gaia node
        self.llm_client = openai.OpenAI(
            base_url=self.config.GAIA_BASE_URL,
            api_key=self.config.GAIA_API_KEY,
            timeout=self.config.REQUEST_TIMEOUT
        )
        
        # Initialize Weaviate client
        auth_config = None
        if self.config.WEAVIATE_USE_AUTH and self.config.WEAVIATE_API_KEY:
            auth_config = Auth.api_key(self.config.WEAVIATE_API_KEY)
        
        # Parse host and port from URL
        if "://" in str(self.config.WEAVIATE_HOST):
            # Remove protocol
            host_port = str(self.config.WEAVIATE_HOST).split("://")[1]
        else:
            host_port = str(self.config.WEAVIATE_HOST)
            
        if ":" in host_port:
            host, port = host_port.split(":")
            port = int(port)
        else:
            host = host_port
            port = self.config.WEAVIATE_PORT
            
        self.weaviate_client = weaviate.connect_to_local(
            host=host,
            port=port,
            auth_credentials=auth_config,
            headers=self.config.get_weaviate_headers()
        )
        
        # Get available models
        self.available_models = []
        self._get_available_models()
    
    def _get_available_models(self):
        """Get available models from Gaia node."""
        try:
            models = self.llm_client.models.list()
            self.available_models = [model.id for model in models.data]
            if self.config.DEBUG:
                print(f"📋 Available models: {self.available_models}")
        except Exception as e:
            print(f"⚠️ Could not fetch models: {e}")
            # Use configured fallback model
            self.available_models = [self.config.GAIA_MODEL_NAME]
    
    def setup_collection(self, collection_name: str = None):
        """Set up a Weaviate collection with configured vectorizer."""
        collection_name = collection_name or self.config.DEFAULT_COLLECTION_NAME
        
        try:
            if self.weaviate_client.collections.exists(collection_name):
                if self.config.DEBUG:
                    print(f"📚 Collection '{collection_name}' already exists")
                return self.weaviate_client.collections.get(collection_name)
            
            # Create collection with configured vectorizer
            vectorizer_config = self.config.get_vectorizer_config()
            
            collection = self.weaviate_client.collections.create(
                name=collection_name,
                vectorizer_config=vectorizer_config,
                properties=[
                    Property(name="title", data_type=DataType.TEXT),
                    Property(name="content", data_type=DataType.TEXT),
                    Property(name="source", data_type=DataType.TEXT),
                    Property(name="category", data_type=DataType.TEXT),
                    Property(
                        name="metadata", 
                        data_type=DataType.OBJECT,
                        nested_properties=[
                            Property(name="url", data_type=DataType.TEXT),
                            Property(name="author", data_type=DataType.TEXT),
                            Property(name="published", data_type=DataType.TEXT),
                            Property(name="difficulty", data_type=DataType.TEXT),
                            Property(name="topic", data_type=DataType.TEXT),
                            Property(name="tags", data_type=DataType.TEXT_ARRAY),
                            Property(name="fetched_at", data_type=DataType.TEXT),
                            Property(name="chunk_index", data_type=DataType.INT),
                            Property(name="total_chunks", data_type=DataType.INT),
                        ]
                    ),
                ]
            )
            print(f"✅ Created collection '{collection_name}' with {self.config.VECTORIZER_MODULE}")
            return collection
            
        except Exception as e:
            print(f"❌ Error creating collection: {e}")
            raise
    
    def add_documents(self, documents: List[Dict[str, Any]], collection_name: str = None):
        """Add documents to the knowledge base using configured batch size."""
        collection_name = collection_name or self.config.DEFAULT_COLLECTION_NAME
        
        try:
            collection = self.weaviate_client.collections.get(collection_name)
            
            # Use configured batch size
            with collection.batch.dynamic() as batch:
                for doc in documents:
                    # Ensure metadata is properly structured
                    metadata = doc.get("metadata", {})
                    if not isinstance(metadata, dict):
                        metadata = {}
                    
                    # Convert lists to proper format for TEXT_ARRAY fields
                    if "tags" in metadata and isinstance(metadata["tags"], list):
                        # Keep as list for TEXT_ARRAY
                        pass
                    elif "tags" in metadata:
                        # Convert single value to list
                        metadata["tags"] = [str(metadata["tags"])]
                    
                    # Ensure numeric fields are proper types
                    if "chunk_index" in metadata:
                        metadata["chunk_index"] = int(metadata.get("chunk_index", 0))
                    if "total_chunks" in metadata:
                        metadata["total_chunks"] = int(metadata.get("total_chunks", 1))
                    
                    batch.add_object(
                        properties={
                            "title": doc.get("title", ""),
                            "content": doc.get("content", ""),
                            "source": doc.get("source", "unknown"),
                            "category": doc.get("category", "general"),
                            "metadata": metadata
                        }
                    )
            
            print(f"📝 Added {len(documents)} documents to '{collection_name}'")
            return len(documents)
            
        except Exception as e:
            print(f"❌ Error adding documents: {e}")
            return 0
    
    def search_knowledge(self, query: str, collection_name: str = None, limit: int = None) -> List[Dict[str, Any]]:
        """Search for relevant documents using configured parameters."""
        collection_name = collection_name or self.config.DEFAULT_COLLECTION_NAME
        limit = limit or self.config.SEARCH_LIMIT
        
        try:
            collection = self.weaviate_client.collections.get(collection_name)
            
            response = collection.query.near_text(
                query=query,
                limit=limit,
                return_metadata=["score", "distance"]
            )
            
            results = []
            for obj in response.objects:
                results.append({
                    "id": str(obj.uuid),
                    "title": obj.properties.get("title", ""),
                    "content": obj.properties.get("content", ""),
                    "source": obj.properties.get("source", ""),
                    "category": obj.properties.get("category", ""),
                    "metadata": obj.properties.get("metadata", {}),
                    "score": obj.metadata.score if obj.metadata else None,
                    "distance": obj.metadata.distance if obj.metadata else None
                })
            
            return results
            
        except Exception as e:
            print(f"❌ Error searching knowledge base: {e}")
            return []
    
    def generate_response(self, query: str, context_docs: List[Dict[str, Any]] = None, model: str = None) -> str:
        """Generate response using configured parameters."""
        try:
            # Use configured model or first available
            if not model:
                model = self.config.GAIA_MODEL_NAME if self.config.GAIA_MODEL_NAME in self.available_models else self.available_models[0]
            
            # Prepare context
            context = ""
            if context_docs:
                context_parts = []
                for doc in context_docs:
                    context_parts.append(f"Title: {doc['title']}\nContent: {doc['content']}")
                context = "\n\n".join(context_parts)
            
            # Prepare system prompt
            system_prompt = "You are a helpful AI assistant."
            if context:
                system_prompt += f" Use the following context to answer the user's question:\n\n{context}"
            
            # Generate response with configured parameters
            response = self.llm_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                max_tokens=self.config.MAX_TOKENS,
                temperature=self.config.TEMPERATURE
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ Error generating response: {e}")
            return f"Error: Could not generate response. {e}"
    
    def rag_query(self, query: str, collection_name: str = None) -> Dict[str, Any]:
        """Perform complete RAG query using all configured parameters."""
        collection_name = collection_name or self.config.DEFAULT_COLLECTION_NAME
        
        if self.config.DEBUG:
            print(f"🔍 RAG Query: '{query}' on collection '{collection_name}'")
        
        # Search for relevant documents
        relevant_docs = self.search_knowledge(query, collection_name)
        
        if self.config.DEBUG:
            print(f"📚 Found {len(relevant_docs)} relevant documents")
        
        # Generate response with context
        response = self.generate_response(query, relevant_docs)
        
        return {
            "query": query,
            "response": response,
            "sources": [
                {
                    "title": doc["title"],
                    "source": doc["source"],
                    "category": doc["category"],
                    "score": doc["score"],
                    "distance": doc["distance"]
                } for doc in relevant_docs
            ],
            "context_documents": relevant_docs,
            "model_used": self.config.GAIA_MODEL_NAME,
            "collection": collection_name,
            "config": {
                "max_tokens": self.config.MAX_TOKENS,
                "temperature": self.config.TEMPERATURE,
                "search_limit": self.config.SEARCH_LIMIT,
                "vectorizer": self.config.VECTORIZER_MODULE
            }
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on both services."""
        health = {
            "timestamp": time.time(),
            "gaia": {"status": "unknown", "models": []},
            "weaviate": {"status": "unknown", "collections": []},
            "overall": "unknown"
        }
        
        try:
            models = self.llm_client.models.list()
            health["gaia"]["status"] = "healthy"
            health["gaia"]["models"] = [m.id for m in models.data]
        except Exception as e:
            health["gaia"]["status"] = f"error: {e}"
        
        try:
            is_ready = self.weaviate_client.is_ready()
            if is_ready:
                collections = self.weaviate_client.collections.list_all()
                health["weaviate"]["status"] = "healthy"
                health["weaviate"]["collections"] = list(collections.keys())
            else:
                health["weaviate"]["status"] = "not ready"
        except Exception as e:
            health["weaviate"]["status"] = f"error: {e}"
        
        health["overall"] = "healthy" if all(
            h.get("status") == "healthy" for h in [health["gaia"], health["weaviate"]]
        ) else "unhealthy"
        
        return health
    
    def close(self):
        """Close connections."""
        self.weaviate_client.close()
        if self.config.DEBUG:
            print("🔄 Connections closed")


def create_sample_documents():
    """Create sample documents for testing."""
    return [
        {
            "title": "Gaia Network Overview",
            "content": "Gaia Network provides decentralized AI infrastructure with OpenAI-compatible APIs. It enables developers to run local LLMs while maintaining compatibility with existing OpenAI-based applications.",
            "source": "gaia_docs",
            "category": "ai-infrastructure",
            "metadata": {
                "difficulty": "beginner", 
                "tags": ["gaia", "llm", "api"],
                "url": "https://docs.gaianet.ai",
                "topic": "infrastructure",
                "fetched_at": "2024-01-01T00:00:00Z"
            }
        },
        {
            "title": "Weaviate Vector Database",
            "content": "Weaviate is an open-source vector database that supports real-time indexing, multiple vectorization modules, and GraphQL queries. It's designed for AI applications requiring semantic search capabilities.",
            "source": "weaviate_docs", 
            "category": "database",
            "metadata": {
                "difficulty": "intermediate", 
                "tags": ["weaviate", "vector", "search"],
                "url": "https://weaviate.io",
                "topic": "database",
                "fetched_at": "2024-01-01T00:00:00Z"
            }
        },
        {
            "title": "RAG Implementation Best Practices",
            "content": "Successful RAG implementations require careful consideration of chunk size, embedding models, retrieval strategies, and prompt engineering. Document preprocessing and metadata handling are crucial for optimal performance.",
            "source": "rag_guide",
            "category": "ai-techniques", 
            "metadata": {
                "difficulty": "advanced", 
                "tags": ["rag", "embeddings", "search"],
                "url": "https://example.com/rag-guide",
                "topic": "techniques",
                "fetched_at": "2024-01-01T00:00:00Z"
            }
        },
        {
            "title": "Local AI Development Benefits",
            "content": "Running AI models locally provides data privacy, cost control, reduced latency, and customization opportunities. Tools like Gaia nodes make local deployment production-ready with minimal infrastructure overhead.",
            "source": "local_ai_guide",
            "category": "development",
            "metadata": {
                "difficulty": "intermediate", 
                "tags": ["local", "privacy", "deployment"],
                "url": "https://example.com/local-ai",
                "topic": "development",
                "fetched_at": "2024-01-01T00:00:00Z"
            }
        }
    ]


def main():
    """Main demonstration with environment-based configuration."""
    print("🚀 Gaia + Weaviate Integration (Environment Configured)")
    print("=" * 70)
    
    # Test configuration first
    if not test_configuration():
        print("❌ Configuration test failed. Please check your .env file.")
        return
    
    # Initialize integration
    print(f"\n🔧 Initializing integration...")
    config = Config()
    integration = GaiaWeaviateIntegration(config)
    
    try:
        # Health check
        print(f"\n🏥 Performing health check...")
        health = integration.health_check()
        print(f"Overall status: {health['overall']}")
        if config.DEBUG:
            print(f"Health details: {json.dumps(health, indent=2)}")
        
        if health['overall'] != 'healthy':
            print("❌ Services are not healthy. Check the health report above.")
            return
        
        # Set up collection
        print(f"\n📚 Setting up collection '{config.DEFAULT_COLLECTION_NAME}'...")
        collection = integration.setup_collection()
        
        # Add sample documents
        print(f"\n📝 Adding sample documents...")
        sample_docs = create_sample_documents()
        docs_added = integration.add_documents(sample_docs)
        
        if docs_added > 0:
            # Test RAG queries
            test_queries = [
                "What is Gaia Network and how does it work?",
                "How do I implement RAG effectively?",
                "What are the benefits of using Weaviate?",
                "Why should I use local AI development?"
            ]
            
            print(f"\n🧪 Testing RAG queries...")
            for i, query in enumerate(test_queries, 1):
                print(f"\n{'='*60}")
                print(f"Query {i}: {query}")
                print('='*60)
                
                result = integration.rag_query(query)
                
                print(f"🤖 Response: {result['response']}")
                print(f"📚 Sources: {[s['title'] for s in result['sources']]}")
                print(f"🏷️ Categories: {list(set(s['category'] for s in result['sources']))}")
                
                if config.DEBUG:
                    print(f"🔧 Config used: {result['config']}")
        
        print(f"\n✅ Demo completed successfully!")
        print(f"\n🎯 Summary:")
        print(f"  ✅ Environment configuration loaded from .env")
        print(f"  ✅ Connected to Gaia node: {config.GAIA_BASE_URL}")
        print(f"  ✅ Connected to Weaviate: {config.WEAVIATE_HOST}:{config.WEAVIATE_PORT}")
        print(f"  ✅ Used vectorizer: {config.VECTORIZER_MODULE}")
        print(f"  ✅ Processed {len(test_queries)} RAG queries")
        print(f"  ✅ Demonstrated Weaviate as Qdrant replacement")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        if config.DEBUG:
            import traceback
            traceback.print_exc()
        
    finally:
        integration.close()


if __name__ == "__main__":
    main()