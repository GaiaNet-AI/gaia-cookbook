#!/usr/bin/env python3
"""
Simple test script for your specific Gaia + Weaviate setup.
"""

import requests
import openai
import weaviate

def test_gaia():
    """Test your Gaia node."""
    print("1️⃣ Testing Gaia Node...")
    gaia_url = "https://0x299eae67ba6bbae8d61faad2d70115dc5a6855c8.gaia.domains/v1"
    
    try:
        # Test OpenAI-compatible client
        client = openai.OpenAI(
            base_url=gaia_url,
            api_key="gaia"
        )
        
        # List models
        models = client.models.list()
        print(f"✅ Gaia connected! Available models: {[m.id for m in models.data]}")
        
        # Test generation
        response = client.chat.completions.create(
            model=models.data[0].id,
            messages=[{"role": "user", "content": "Hello! Respond with just 'Hi there!'"}],
            max_tokens=10
        )
        print(f"✅ Generation test: {response.choices[0].message.content}")
        return True
        
    except Exception as e:
        print(f"❌ Gaia test failed: {e}")
        return False

def test_weaviate():
    """Test your local Weaviate."""
    print("\n2️⃣ Testing Weaviate...")
    
    try:
        # Test connection
        client = weaviate.connect_to_local(host="localhost", port=8080)
        print(f"✅ Weaviate connected! Ready: {client.is_ready()}")
        
        # List existing collections
        collections = client.collections.list_all()
        print(f"✅ Existing collections: {list(collections.keys())}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Weaviate test failed: {e}")
        return False

def main():
    print("🧪 Quick Test for Your Setup")
    print("=" * 40)
    
    gaia_ok = test_gaia()
    weaviate_ok = test_weaviate()
    
    if gaia_ok and weaviate_ok:
        print(f"\n🎉 Both services working! You can run the main demo.")
        print(f"\n💡 Use this configuration:")
        print(f"   Gaia: https://0x299eae67ba6bbae8d61faad2d70115dc5a6855c8.gaia.domains/v1")
        print(f"   Weaviate: localhost:8080")
    else:
        print(f"\n❌ Some services not working. Check the errors above.")

if __name__ == "__main__":
    main()