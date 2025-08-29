# -----------------------------------------------------------------------------
# Author: Harish Kotra
# GitHub: https://github.com/harishkotra
# X (Twitter): https://x.com/HarishKotra
# Date: 2025-08-26
# Description: Gaia Node + Langfuse Streamlit Demo Application
# -----------------------------------------------------------------------------

import streamlit as st
import os
from langfuse.openai import openai
from langfuse import observe, get_client

# Streamlit app configuration
st.set_page_config(
    page_title="Gaia Node + Langfuse Demo",
    page_icon="🚀",
    layout="wide"
)

# Sidebar for configuration
st.sidebar.title("🔧 Configuration")
st.sidebar.info("Enter your API keys to get started")

# Input fields for credentials
langfuse_public_key = st.sidebar.text_input("Langfuse Public Key", type="password")
langfuse_secret_key = st.sidebar.text_input("Langfuse Secret Key", type="password")
gaia_node_api_key = st.sidebar.text_input("Gaia Node API Key", type="password")
gaia_node_base_url = st.sidebar.text_input("Gaia Node Base URL", "https://your-gaia-node-url.gaia.domains/v1")

# Set environment variables for Langfuse
if langfuse_public_key and langfuse_secret_key:
    os.environ["LANGFUSE_PUBLIC_KEY"] = langfuse_public_key
    os.environ["LANGFUSE_SECRET_KEY"] = langfuse_secret_key
    os.environ["LANGFUSE_HOST"] = "https://cloud.langfuse.com"

# Main app
st.title("🚀 Gaia Node + Langfuse Integration Demo")
st.markdown("---")

def initialize_gaia_client():
    """Initialize OpenAI client for Gaia Node"""
    try:
        # Create OpenAI client configured for Gaia Node
        client = openai.OpenAI(
            base_url=gaia_node_base_url,
            api_key=gaia_node_api_key,
            default_headers={
                "HTTP-Referer": "https://gaia-langfuse-demo.streamlit.app",
                "X-Title": "Gaia Node Langfuse Demo",
            }
        )
        return client
    except Exception as e:
        st.error(f"Error initializing client: {e}")
        return None

def simple_chat_demo():
    """Demo simple chat completion with Gaia Node"""
    st.header("💬 Simple Chat Demo")
    
    user_input = st.text_area(
        "Enter your message:",
        "Explain the concept of black holes in simple terms.",
        height=100
    )
    
    if st.button("Send Message", key="chat_btn"):
        if not all([langfuse_public_key, langfuse_secret_key, gaia_node_api_key]):
            st.error("Please enter all API keys in the sidebar")
            return
            
        client = initialize_gaia_client()
        if not client:
            return
            
        try:
            with st.spinner("🔄 Making request to Gaia Node..."):
                # Simple chat completion with automatic tracing
                response = client.chat.completions.create(
                    name="gaia-chat-request",
                    model="Qwen3-4B-Q5_K_M",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant specialized in astronomy."},
                        {"role": "user", "content": user_input}
                    ],
                    max_tokens=300,
                    temperature=0.7,
                    metadata={"demo_type": "simple_chat"}
                )
                
                result = response.choices[0].message.content
                
                st.success("✅ Request completed!")
                st.subheader("Response:")
                st.write(result)
                
                # Show usage info if available
                if hasattr(response, 'usage') and response.usage:
                    st.subheader("📊 Usage")
                    col1, col2, col3 = st.columns(3)
                    col1.metric("Prompt Tokens", response.usage.prompt_tokens)
                    col2.metric("Completion Tokens", response.usage.completion_tokens)
                    col3.metric("Total Tokens", response.usage.total_tokens)
                
                st.info("📊 Check your Langfuse dashboard for tracing and analytics!")
                
        except Exception as e:
            st.error(f"❌ Error: {e}")

def nested_operations_demo():
    """Demo nested operations with Gaia Node using @observe decorator"""
    st.header("🔄 Nested Operations Demo")
    
    concept = st.text_input("Enter an astronomy concept:", "neutron stars")
    
    if st.button("Analyze Concept", key="nested_btn"):
        if not all([langfuse_public_key, langfuse_secret_key, gaia_node_api_key]):
            st.error("Please enter all API keys in the sidebar")
            return
            
        client = initialize_gaia_client()
        if not client:
            return
            
        try:
            with st.spinner("🔄 Analyzing concept with nested operations..."):
                
                @observe()
                def analyze_astronomy_concept(concept: str):
                    """Analyze an astronomy concept using Gaia Node"""
                    response = client.chat.completions.create(
                        name="concept-analysis",
                        model="Qwen3-4B-Q5_K_M",
                        messages=[
                            {"role": "system", "content": "You are an astronomy expert. Provide detailed explanations."},
                            {"role": "user", "content": f"Explain {concept} in detail with examples."}
                        ],
                        max_tokens=250,
                        metadata={"concept": concept}
                    )
                    return response.choices[0].message.content
                
                @observe()
                def generate_quiz_question(explanation: str, concept: str):
                    """Generate a quiz question based on the explanation"""
                    response = client.chat.completions.create(
                        name="quiz-generation",
                        model="Qwen3-4B-Q5_K_M",
                        messages=[
                            {"role": "system", "content": "You create educational quiz questions."},
                            {"role": "user", "content": f"Based on this explanation:\n{explanation}\n\nCreate a multiple-choice quiz question about {concept}."}
                        ],
                        max_tokens=150,
                        metadata={"concept": concept}
                    )
                    return response.choices[0].message.content
                
                # Execute nested operations
                explanation = analyze_astronomy_concept(concept)
                quiz_question = generate_quiz_question(explanation, concept)
                
                st.success("✅ Nested analysis completed!")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.subheader("📚 Explanation")
                    st.write(explanation)
                
                with col2:
                    st.subheader("❓ Quiz Question")
                    st.write(quiz_question)
                
                st.info("🎯 Check Langfuse dashboard to see the nested trace structure!")
                
        except Exception as e:
            st.error(f"❌ Error: {e}")

def batch_processing_demo():
    """Demo batch processing with multiple concepts"""
    st.header("📦 Batch Processing Demo")
    
    concepts = st.text_area(
        "Enter astronomy concepts (one per line):",
        "black holes\nneutron stars\nsupernovae\nexoplanets",
        height=150
    )
    
    if st.button("Process Batch", key="batch_btn"):
        if not all([langfuse_public_key, langfuse_secret_key, gaia_node_api_key]):
            st.error("Please enter all API keys in the sidebar")
            return
            
        client = initialize_gaia_client()
        if not client:
            return
            
        try:
            concept_list = [concept.strip() for concept in concepts.split('\n') if concept.strip()]
            
            if not concept_list:
                st.warning("Please enter at least one concept")
                return
            
            @observe()
            def process_batch_concepts(concepts):
                results = []
                for concept in concepts:
                    response = client.chat.completions.create(
                        name="batch-concept",
                        model="Qwen3-4B-Q5_K_M",
                        messages=[
                            {"role": "system", "content": "You are an astronomy expert. Provide a 2-3 sentence explanation."},
                            {"role": "user", "content": f"Explain {concept} briefly."}
                        ],
                        max_tokens=100,
                        metadata={"concept": concept}
                    )
                    results.append({"concept": concept, "explanation": response.choices[0].message.content})
                return results
            
            results = process_batch_concepts(concept_list)
            
            st.success(f"✅ Processed {len(results)} concepts!")
            
            for result in results:
                with st.expander(f"🔭 {result['concept']}"):
                    st.write(result['explanation'])
            
            st.info("📊 Check Langfuse dashboard for batch processing traces!")
            
        except Exception as e:
            st.error(f"❌ Error: {e}")

def advanced_tracing_demo():
    """Demo advanced tracing features"""
    st.header("⚡ Advanced Tracing Demo")
    
    user_id = st.text_input("User ID (for tracing):", "user-123")
    session_id = st.text_input("Session ID (for tracing):", "session-456")
    
    question = st.text_area(
        "Enter your question:",
        "What are the main components of a star?",
        height=80
    )
    
    if st.button("Ask with Advanced Tracing", key="advanced_btn"):
        if not all([langfuse_public_key, langfuse_secret_key, gaia_node_api_key]):
            st.error("Please enter all API keys in the sidebar")
            return
            
        client = initialize_gaia_client()
        if not client:
            return
            
        try:
            with st.spinner("🔄 Processing with advanced tracing..."):
                response = client.chat.completions.create(
                    name="advanced-tracing-demo",
                    model="Qwen3-4B-Q5_K_M",
                    messages=[
                        {"role": "system", "content": "You are an astronomy expert providing detailed explanations."},
                        {"role": "user", "content": question}
                    ],
                    max_tokens=200,
                    temperature=0.7,
                    # Langfuse-specific tracing features
                    user_id=user_id,
                    session_id=session_id,
                    tags=["astronomy", "education", "demo"],
                    metadata={
                        "demo_type": "advanced_tracing",
                        "user_id": user_id,
                        "session_id": session_id
                    }
                )
                
                result = response.choices[0].message.content
                
                st.success("✅ Request completed with advanced tracing!")
                st.subheader("Response:")
                st.write(result)
                
                st.info("👤 User tracing enabled")
                st.info("📋 Session tracking active")
                st.info("🏷️ Tags and metadata recorded")
                st.info("📊 Check Langfuse dashboard for detailed trace!")
                
        except Exception as e:
            st.error(f"❌ Error: {e}")

# Main app layout
tab1, tab2, tab3, tab4 = st.tabs(["💬 Simple Chat", "🔄 Nested Operations", "📦 Batch Processing", "⚡ Advanced Tracing"])

with tab1:
    simple_chat_demo()

with tab2:
    nested_operations_demo()

with tab3:
    batch_processing_demo()

with tab4:
    advanced_tracing_demo()

# Footer
st.markdown("---")
st.markdown("""
### 📋 Instructions:
1. Enter your API keys in the sidebar
2. Choose a demo tab
3. Click the action button
4. Check your [Langfuse dashboard](https://cloud.langfuse.com) for traces

### 🔧 Required:
- Langfuse Public/Secret keys
- Gaia Node API key and base URL
- `langfuse` and `openai` Python packages
""")

try:
    langfuse_client = get_client()
    langfuse_client.flush()
except:
    pass