# debug_api_format.py
import requests
import json

def debug_api_format():
    """Debug the exact API format that Cosdata expects"""
    
    # Test the exact endpoint that the SDK uses
    base_url = "http://127.0.0.1:8443/api/v1"
    auth = ("admin", "admin")
    
    # 1. Check collections
    print("=== Collections ===")
    try:
        response = requests.get(f"{base_url}/collections", auth=auth, verify=False)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            collections = response.json()
            print("Collections:", json.dumps(collections, indent=2))
    except Exception as e:
        print(f"Error: {e}")
    
    # 2. Check what a specific collection expects
    print("\n=== Collection Structure ===")
    try:
        # Create a test collection
        create_response = requests.post(
            f"{base_url}/collections",
            auth=auth,
            json={
                "name": "debug_test",
                "dimension": 768,
                "description": "Test collection for debugging"
            },
            verify=False
        )
        print(f"Create status: {create_response.status_code}")
        if create_response.status_code == 201:
            print("Collection created")
            
            # Try to insert a vector
            vector_data = {
                "id": "debug_vector_1",
                "dense_values": [0.1] * 768
            }
            
            insert_response = requests.post(
                f"{base_url}/collections/debug_test/vectors",
                auth=auth,
                json=vector_data,
                verify=False
            )
            print(f"Insert status: {insert_response.status_code}")
            print(f"Insert response: {insert_response.text}")
            
            # Clean up
            delete_response = requests.delete(
                f"{base_url}/collections/debug_test",
                auth=auth,
                verify=False
            )
            print(f"Delete status: {delete_response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_api_format()