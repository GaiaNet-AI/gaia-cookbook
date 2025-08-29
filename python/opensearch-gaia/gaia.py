import streamlit as st
import requests
import pandas as pd
import matplotlib.pyplot as plt
import json
from datetime import datetime
from opensearchpy import OpenSearch

# Initialize OpenSearch client
try:
    opensearch = OpenSearch(
        hosts=[{"host": "localhost", "port": 9200}],
        http_compress=True,
        use_ssl=False,
        verify_certs=False,
        ssl_assert_hostname=False,
        ssl_show_warn=False,
    )
    CLIENT_TYPE = "opensearch-py"
except ImportError:
    opensearch = None
    CLIENT_TYPE = "requests"

# Check if index exists
def index_exists(index_name):
    try:
        if CLIENT_TYPE == "opensearch-py":
            return opensearch.indices.exists(index=index_name)
        else:
            response = requests.head(f"http://localhost:9200/{index_name}")
            return response.status_code == 200
    except Exception as e:
        st.error(f"Connection error: {str(e)}")
        return False

# Search function
def search_reviews(query_text, size=10):
    query = {
        "query": {
            "multi_match": {
                "query": query_text,
                "fields": ["content", "title", "author", "airline_name"]
            }
        },
        "size": size
    }
    
    try:
        if CLIENT_TYPE == "opensearch-py":
            return opensearch.search(index="airline_reviews", body=query)
        else:
            response = requests.get(
                "http://localhost:9200/airline_reviews/_search",
                json=query
            )
            return response.json()
    except Exception as e:
        st.error(f"Search error: {str(e)}")
        return None

# Send data to Gaia
def send_to_gaia(prompt, analysis_results):
    gaia_url = st.session_state.get("gaia_node_url", "").strip()
    if not gaia_url:
        gaia_url = "https://0xee7253294f6580c32c3ed745fe578b2eb8220f46.gaia.domains/v1/chat/completions"

    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4",
        "messages": [
            {
                "role": "system",
                "content": "You are an airline industry analyst. Provide insights based on the data."
            },
            {
                "role": "user",
                "content": f"Query: {prompt}\n\nAnalysis Results:\n{json.dumps(analysis_results, indent=2)}"
            }
        ],
        "temperature": 0.7
    }

    try:
        response = requests.post(gaia_url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()

        content = result['choices'][0]['message']['content']
        model = result.get('model', 'unknown')

        think_part = ""
        if "<think>" in content and "</think>" in content:
            think_part = content.split("<think>")[1].split("</think>")[0].strip()
            content = content.split("</think>")[-1].strip()

        return {
            "content": content,
            "model": model,
            "think": think_part
        }

    except Exception as e:
        st.error(f"Error sending to Gaia: {str(e)}")
        return None

# Streamlit UI configuration
st.set_page_config(page_title="Airline Reviews Dashboard", layout="wide")

# Sidebar controls
with st.sidebar:
    st.title("Settings")
    st.write(f"Using {CLIENT_TYPE} client")

    # Gaia Node URL
    st.session_state.gaia_node_url = st.text_input(
        "Gaia Node URL", 
        value="https://0xee7253294f6580c32c3ed745fe578b2eb8220f46.gaia.domains/v1/chat/completions"
    )

    # Placeholder for Gaia model name
    if "gaia_model" in st.session_state:
        st.markdown(f"**Gaia Model**: Qwen3-4B-Q5_K_M Thinking")


    # Index management
    if not index_exists("airline_reviews"):
        st.error("⚠️ airline_reviews index not found!")
        if st.button("Create index (requires admin)"):
            mapping = {
                "mappings": {
                    "properties": {
                        "airline_name": {"type": "text"},
                        "title": {"type": "text"},
                        "author": {"type": "text"},
                        "author_country": {"type": "text"},
                        "date": {"type": "date"},
                        "content": {"type": "text"},
                        "cabin_flown": {"type": "keyword"},
                        "overall_rating": {"type": "float"},
                        "seat_comfort_rating": {"type": "float"},
                        "cabin_staff_rating": {"type": "float"},
                        "food_beverages_rating": {"type": "float"},
                        "inflight_entertainment_rating": {"type": "float"},
                        "value_money_rating": {"type": "float"},
                        "recommended": {"type": "boolean"}
                    }
                }
            }

            try:
                if CLIENT_TYPE == "opensearch-py":
                    opensearch.indices.create("airline_reviews", body=mapping)
                else:
                    requests.put("http://localhost:9200/airline_reviews", json=mapping)
                st.success("Index created successfully!")
                st.rerun()
            except Exception as e:
                st.error(f"Failed to create index: {str(e)}")

    # Query settings
    st.subheader("Search Settings")
    query_size = st.slider("Results per query", 1, 100, 10)

# Main application
st.title("✈️ Airline Reviews Chat & Analytics")

# Check if index exists before proceeding
if not index_exists("airline_reviews"):
    st.error("The 'airline_reviews' index doesn't exist. Please create it using the sidebar.")
    st.stop()

# Chat interface
if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Ask about airline reviews..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    
    with st.chat_message("user"):
        st.markdown(prompt)
    
    with st.spinner("Searching reviews..."):
        response = search_reviews(prompt, query_size)
        
        if response and response.get("hits", {}).get("hits"):
            hits = response['hits']['hits']
            response_text = f"Found {len(hits)} reviews matching your query:\n\n"
            
            reviews_data = []
            for hit in hits:
                source = hit['_source']
                reviews_data.append(source)
                response_text += f"**{source.get('airline_name', 'Unknown')} - {source.get('title', 'No title')}**\n"
                response_text += f"By {source.get('author', 'Anonymous')} ({source.get('date', 'No date')})\n"
                response_text += f"Rating: {source.get('overall_rating', 'N/A')}/10\n"
                response_text += f"\"{source.get('content', '')[:150]}...\"\n\n"
            
            st.session_state.messages.append({"role": "assistant", "content": response_text})
            
            with st.chat_message("assistant"):
                st.markdown(response_text)
            
            # Analytics
            df = pd.DataFrame(reviews_data)
            
            if not df.empty:
                st.subheader("📊 Analytics")
                
                # Convert date if present
                if 'date' in df.columns:
                    df['date'] = pd.to_datetime(df['date'], errors='coerce')
                
                # Ratings distribution
                col1, col2 = st.columns(2)

                with col1:
                    with st.expander("📈 Ratings Distribution"):
                        st.markdown("_This chart shows how airline reviews are distributed across different overall rating scores._")
                        fig, ax = plt.subplots()
                        df['overall_rating'].value_counts().sort_index().plot(kind='bar', ax=ax)
                        ax.set_xlabel("Rating")
                        ax.set_ylabel("Count")
                        st.pyplot(fig)

                with col2:
                    with st.expander("🛫 Airlines Distribution"):
                        st.markdown("_This chart shows the number of reviews received by the top 10 airlines._")
                        fig, ax = plt.subplots()
                        df['airline_name'].value_counts().head(10).plot(kind='bar', ax=ax)
                        ax.set_xlabel("Airline")
                        ax.set_ylabel("Count")
                        st.pyplot(fig)

                
                # Time series if date available
                if 'date' in df.columns and not df['date'].isnull().all():
                    with st.expander("🕒 Reviews Over Time"):
                        st.markdown("_This time series plot shows how the number of reviews has changed over time (monthly)._")
                        time_df = df.set_index('date').resample('M').size()
                        fig, ax = plt.subplots()
                        time_df.plot(ax=ax)
                        ax.set_xlabel("Date")
                        ax.set_ylabel("Number of Reviews")
                        st.pyplot(fig)

                
                # Gaia integration
                st.subheader("🧠 Gaia AI Insights")
                
                # Prepare analysis results
                analysis_results = {
                    "query": prompt,
                    "total_reviews": len(df),
                    "average_rating": df['overall_rating'].mean(),
                    "top_airlines": df['airline_name'].value_counts().head(3).to_dict(),
                    "rating_distribution": df['overall_rating'].value_counts().to_dict()
                }
                
                # Send to Gaia
                with st.spinner("Getting insights from Gaia..."):
                    gaia_response = send_to_gaia(prompt, analysis_results)
                    
                    if gaia_response:
                        st.session_state.gaia_model = gaia_response.get("model", "unknown")
                        ai_response = gaia_response["content"]
                        think_part = gaia_response.get("think", "")

                        if think_part:
                            with st.expander("🧠 Gaia Thinking (internal reasoning)", expanded=False):
                                st.markdown(think_part)

                        st.session_state.messages.append({"role": "assistant", "content": f"**Gaia Insights:**\n\n{ai_response}"})
                        st.markdown(f"**Gaia Insights:**\n\n{ai_response}")

                    else:
                        st.error("Failed to get response from Gaia")

        else:
            error_msg = "No results found or error in search."
            st.session_state.messages.append({"role": "assistant", "content": error_msg})
            with st.chat_message("assistant"):
                st.error(error_msg)

# Clear chat button
if st.button("Clear Chat History"):
    st.session_state.messages = []
    st.rerun()