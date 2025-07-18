# Document Question Answering with Gaia Node and Chroma DB

This example demonstrates how to build a simple Document Question Answering (QA) system using LangChain, integrated with your custom Gaia Node for powerful Language Model (LLM) and Embedding capabilities, and **ChromaDB** for local vector database persistence.


https://github.com/user-attachments/assets/964ec4fd-03bf-4158-a82e-871ed1c228e3


## Introduction

This repository provides a practical example of a Retrieval-Augmented Generation (RAG) pipeline. It allows you to ask questions about a text document (`state_of_the_union.txt` by default), retrieve relevant information from it using a vector database, and then generate an answer using a Large Language Model. The key distinction here is the use of a self-hosted **Gaia Node** for LLM and embeddings, coupled with **ChromaDB** for efficient and persistent vector storage locally.

## Key Technologies

### Gaia Node

Gaia Node provides an **OpenAI-compatible API** endpoint, allowing you to run various LLMs and embedding models locally or on your own infrastructure. This offers greater control over data, privacy, and potentially lower costs compared to cloud-based API providers. It abstracts away the complexities of running models, presenting a familiar interface to tools like LangChain.

### ChromaDB

Chroma is an **open-source vector database** that is lightweight and easy to get started with. It's designed for simplicity and can run in-memory or persist data to disk, making it ideal for local development, prototyping, and applications where a full-fledged distributed vector database might be overkill. It stores numerical representations (vectors/embeddings) of text and allows for efficient similarity searches, crucial for RAG applications.

## Project Goal

The primary goal of this project is to demonstrate:

*   How to configure LangChain to connect to a **Gaia Node** for both embeddings and LLM inference.
*   How to use **ChromaDB** as a vector store for document chunking and retrieval.
*   How to build a simple **Question Answering system** over custom documents using these components.
*   Showcase **local persistence** of the vector database for faster subsequent runs.

## Setup and Running

### Prerequisites

*   **Python 3.8+**
*   **A running Gaia Node instance:** Ensure your Gaia Node is accessible via the URL you'll configure and has the necessary embedding and LLM models loaded (e.g., `Nomic-embed-text-v1.5` and `Llama-3-Groq-8B-Tool-Use-Q5_K_M`). [Run your own Gaia node on your machine](https://docs.gaianet.ai/getting-started/quick-start/).

### Installation

1.  **Clone this repository** (or copy the `demo.py` content).
2.  **Navigate to the project directory.**
3.  **Install the required Python packages:**
    ```bash
    pip install langchain-community langchain-openai chromadb
    ```

### Configuration

Open the `demo.py` file and **update the following variables** at the top of the script with your Gaia Node details:

```python
# Configuration for Gaia Node
GAIA_NODE_URL = "https://0x5ee30a31554672a0c213ed38e8898de84c2bb34b.gaia.domains"  # Replace with your Gaia node URL
GAIA_API_KEY = "gaia"  # Replace with your Gaia API key (e.g., "gaia" if default)
```

Make sure the `state_of_the_union.txt` file is in the same directory as `demo.py`, or update the `document_path` variable to point to your desired document.

### Running the Demo

Execute the script from your terminal:

```bash
python demo.py
```

The script will:

1.  Test the connection to your Gaia Node for both embeddings and LLM.
2.  Load and process the `state_of_the_union.txt` document.
3.  Create a new ChromaDB vector store (or load an existing one if `gaia_chroma_db` directory exists).
4.  Persist the ChromaDB to disk for future runs.
5.  Initialize the QA chain.
6.  Run a few example queries.
7.  Offer to delete the created database at the end.

![response](https://hackmd.io/_uploads/SJ3LoxdIle.png)
![another response](https://hackmd.io/_uploads/ryg-2guIgl.png)

### Why Use ChromaDB Here?

For this demo, ChromaDB is an excellent choice because:
- It's incredibly easy to set up and use locally.
- It provides the necessary vector persistence, allowing for quick restarts and iterative development without re-processing documents.
-  It works perfectly with LangChain's `OpenAIEmbeddings` (which are powered by your Gaia Node), providing the vectorization capabilities needed for RAG.

## Conclusion

This project provides a robust foundation for building RAG applications using a self-hosted Gaia Node for LLM inference and embeddings, combined with the convenient and persistent ChromaDB for vector storage. This setup offers flexibility, privacy, and cost-efficiency for your generative AI projects.

Full code explained [here](https://hackmd.io/@harishatgaia/gaia-chromadb).
