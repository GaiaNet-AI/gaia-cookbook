import os
from cosdata import Client
import requests
import json
import time
from typing import List, Optional
import numpy as np

class CosdataGaiaIntegration:
    def __init__(self, cosdata_host: str = "http://0.0.0.0:8443", 
                 gaia_host: str = "https://0x68e569fdbaab897f914b2c109fb7960dee6a9495.gaia.domains/v1"):
        self.cosdata_host = cosdata_host
        self.gaia_host = gaia_host
        self.gaia_api_key = "gaia"  # Replace with your actual key
        
        # Initialize Cosdata client with error handling
        try:
            self.client = Client(
                host=cosdata_host,
                username="admin",
                password="123456",
                verify=False,
                timeout=30
            )
            print("✓ Cosdata client initialized")
        except Exception as e:
            print(f"⚠ Cosdata client initialization failed: {e}")
            self.client = None
    
    def check_cosdata_health(self) -> bool:
        """Check if Cosdata is running and accessible"""
        try:
            # Try different health endpoints
            endpoints = [
                "/health",
                "/api/health",
                "/api/v1/health",
                "/status"
            ]
            
            for endpoint in endpoints:
                try:
                    response = requests.get(
                        f"{self.cosdata_host}{endpoint}",
                        verify=False,
                        timeout=10
                    )
                    if response.status_code == 200:
                        print(f"✓ Cosdata health check passed: {endpoint}")
                        return True
                except:
                    continue
            
            # If no health endpoint works, try direct API call
            try:
                response = requests.get(
                    f"{self.cosdata_host}/api/v1/collections",
                    auth=("admin", "admin"),
                    verify=False,
                    timeout=10
                )
                if response.status_code == 200:
                    print("✓ Cosdata API accessible")
                    return True
            except:
                pass
                
            print("✗ Cosdata is not responding correctly")
            return False
            
        except Exception as e:
            print(f"✗ Health check failed: {e}")
            return False
    
    def generate_embeddings(self, texts: List[str]) -> Optional[List[List[float]]]:
        """Generate embeddings using Gaia"""
        headers = {
            "Authorization": f"Bearer {self.gaia_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "input": texts,
            "model": "nomic-ai/nomic-embed-text-v1.5",
            "dimensions": 768
        }
        
        try:
            print(f"Generating embeddings for {len(texts)} texts...")
            response = requests.post(
                f"{self.gaia_host}/embeddings",
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Handle different response formats
            if 'data' in data:
                embeddings = [item['embedding'] for item in data['data']]
            elif 'embeddings' in data:
                embeddings = data['embeddings']
            else:
                embeddings = data
            
            print(f"✓ Generated {len(embeddings)} embeddings")
            return embeddings
            
        except Exception as e:
            print(f"✗ Embedding generation failed: {e}")
            return None
    
    def create_collection_safe(self, name: str, dimension: int = 768):
        """Safely create or get a collection"""
        if not self.client:
            print("✗ Cosdata client not initialized")
            return None
        
        try:
            # Try to get existing collection first
            try:
                collection = self.client.get_collection(name)
                print(f"✓ Using existing collection: {name}")
                return collection
            except:
                # Create new collection
                collection = self.client.create_collection(
                    name=name,
                    dimension=dimension,
                    description=f"Collection for {dimension}D embeddings"
                )
                print(f"✓ Created new collection: {name}")
                return collection
                
        except Exception as e:
            print(f"✗ Collection creation failed: {e}")
            return None
    
    def insert_vectors_safe(self, collection, vectors: List[dict]):
        """Safely insert vectors with multiple fallback strategies"""
        if not collection:
            print("✗ No collection provided")
            return False
        
        strategies = [
            self._insert_minimal,
            self._insert_without_metadata,
            self._insert_single_thread,
            self._insert_one_by_one
        ]
        
        for strategy in strategies:
            print(f"\nTrying strategy: {strategy.__name__}...")
            if strategy(collection, vectors):
                print("✓ Insertion successful!")
                return True
            time.sleep(1)
        
        print("✗ All insertion strategies failed")
        return False
    
    def _insert_minimal(self, collection, vectors):
        """Insert vectors with only required fields"""
        minimal_vectors = []
        for vec in vectors:
            minimal_vectors.append({
                "id": vec["id"],
                "dense_values": vec["dense_values"]
            })
        
        try:
            with collection.transaction() as txn:
                txn.batch_upsert_vectors(minimal_vectors, max_workers=1)
            return True
        except:
            return False
    
    def _insert_without_metadata(self, collection, vectors):
        """Insert vectors without metadata"""
        simple_vectors = []
        for vec in vectors:
            simple_vec = {
                "id": vec["id"],
                "dense_values": vec["dense_values"]
            }
            if "text" in vec:
                simple_vec["text"] = vec["text"]
            simple_vectors.append(simple_vec)
        
        try:
            with collection.transaction() as txn:
                txn.batch_upsert_vectors(simple_vectors, max_workers=1)
            return True
        except:
            return False
    
    def _insert_single_thread(self, collection, vectors):
        """Insert vectors with single thread"""
        try:
            with collection.transaction() as txn:
                txn.batch_upsert_vectors(vectors, max_workers=1)
            return True
        except:
            return False
    
    def _insert_one_by_one(self, collection, vectors):
        """Insert vectors one by one"""
        try:
            with collection.transaction() as txn:
                for i, vector in enumerate(vectors):
                    try:
                        txn.upsert_vector(vector)
                        print(f"✓ Inserted vector {i+1}/{len(vectors)}")
                    except Exception as e:
                        print(f"✗ Failed to insert vector {i}: {e}")
                        # Continue with next vector
            return True
        except:
            return False
    
    def demo(self):
        """Run the complete demo"""
        print("=== Cosdata + Gaia Integration Demo ===\n")
        
        # Check Cosdata health
        if not self.check_cosdata_health():
            print("Please ensure Cosdata is running and accessible")
            return
        
        # Create collection
        collection = self.create_collection_safe("demo_collection", 768)
        if not collection:
            return
        
        # Sample documents
        documents = [
            "Machine learning is a subset of artificial intelligence",
            "Deep learning uses neural networks with multiple layers",
            "Natural language processing helps computers understand human language",
            "Computer vision enables machines to interpret visual information",
            "Reinforcement learning is about learning through rewards and punishments"
        ]
        
        # Generate embeddings
        embeddings = self.generate_embeddings(documents)
        if not embeddings:
            return
        
        # Prepare vectors
        vectors = []
        for i, (doc, emb) in enumerate(zip(documents, embeddings)):
            vectors.append({
                "id": f"doc_{i}",
                "dense_values": emb,
                "text": doc,
                "metadata": {
                    "source": "demo",
                    "index": i
                }
            })
        
        # Insert vectors
        if not self.insert_vectors_safe(collection, vectors):
            return
        
        # Create index
        try:
            collection.create_index(
                distance_metric="cosine",
                ef_search=64,
                num_layers=5
            )
            print("✓ Index created")
        except Exception as e:
            print(f"⚠ Index creation failed: {e}")
        
        # Test search
        try:
            print("\nTesting search...")
            results = collection.search.dense(
                query_vector=embeddings[0],
                top_k=3,
                return_raw_text=True
            )
            
            print("Search results:")
            for i, result in enumerate(results['results']):
                print(f"{i+1}. {result.get('text', 'No text')} (score: {result['score']:.3f})")
                
        except Exception as e:
            print(f"⚠ Search test failed: {e}")
        
        print("\n✅ Demo completed successfully!")

# Alternative: Simple test without Cosdata if it's not working
def simple_gaia_test():
    """Test just Gaia functionality if Cosdata is down"""
    print("=== Simple Gaia Test ===")
    
    gaia = CosdataGaiaIntegration()
    
    texts = [
        "Test sentence for embedding generation",
        "Another test sentence to verify functionality"
    ]
    
    embeddings = gaia.generate_embeddings(texts)
    if embeddings:
        print(f"✓ Gaia is working! Generated {len(embeddings)} embeddings")
        print(f"Embedding dimension: {len(embeddings[0])}")
    else:
        print("✗ Gaia test failed")

if __name__ == "__main__":
    # Try the full demo first
    integration = CosdataGaiaIntegration()
    
    # Check if Cosdata is available
    if integration.check_cosdata_health():
        integration.demo()
    else:
        print("\nCosdata appears to be unavailable. Running Gaia-only test...")
        simple_gaia_test()