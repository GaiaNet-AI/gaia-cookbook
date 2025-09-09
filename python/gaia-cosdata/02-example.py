from openai import OpenAI
from cosdata import Client
import logging
logging.basicConfig(level=logging.DEBUG)

# Gaia client
gaia = OpenAI(
    base_url="https://0x68e569fdbaab897f914b2c109fb7960dee6a9495.gaia.domains/v1",
    api_key="gaia"
)

# Cosdata client
client = Client(host="http://0.0.0.0:8443", username="admin", password="123456", verify=False)

collection = client.get_collection("demo_basic")

# Query text
query = "What is Gaia Nodes?"

# Get embedding
def get_embedding(text):
    response = gaia.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

query_vector = get_embedding(query)

# Search
results = collection.search.dense(
    query_vector=query_vector,
    top_k=3,
    return_raw_text=True
)

print("🔍 Search Results:")
for res in results["results"]:
    print(f"ID: {res['id']} | Score: {res['score']:.4f} | Text: {res['text']}")