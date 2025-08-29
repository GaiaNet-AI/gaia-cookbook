# ✈️ Airline Reviews Chat & Analytics (Gaia + OpenSearch)

This Streamlit app is a working demo that combines **OpenSearch** for fast, flexible search over airline reviews and **Gaia** (an OpenAI-compatible local LLM node) to generate intelligent insights based on query results.

![screencapture-localhost-8501-2025-06-03-09_47_05](https://github.com/user-attachments/assets/6e7322d8-264b-4f87-a1d5-df761fb24858)
![screencapture-localhost-8501-2025-06-03-09_49_24](https://github.com/user-attachments/assets/9aba7f17-5316-47d9-8cde-d3e49c1b1fac)
![screencapture-localhost-8501-2025-06-03-09_49_08](https://github.com/user-attachments/assets/6a774c2c-1ae9-4d60-ae18-36e59ed0e04f)


## 🚀 Why This Demo Matters

- **OpenSearch** handles powerful full-text search, filtering, and analytics at scale.
- **Gaia** adds natural language understanding and reasoning over the search results — giving users *actionable insights*, not just data.
- Together, they showcase how local LLMs can power search + analytics pipelines **without relying on external APIs or cloud services**.

## 🧠 What It Does

- Query airline reviews using natural language.
- Visualize data (ratings, airlines, trends over time).
- Generate AI-driven insights using a Gaia node running locally or on a custom URL.
- Review Gaia’s thought process with `<think>` preambles for transparency.

## 🌟 Key Features

- 🔍 OpenSearch-based full-text search over structured review data.
- 📊 Expandable, explained visualizations for intuitive analysis.
- 🧠 Gaia LLM integration for dynamic, context-aware summaries and recommendations.
- 🧩 Modular and extendable — run your own models or plug in other datasets.

## 🛠️ What You Can Build Next

- 🌍 Replace airline reviews with your own datasets (e.g., product reviews, research papers, financial reports).
- 💬 Build chat interfaces for real-time analysis over any OpenSearch index.
- 🧬 Add RAG (Retrieval-Augmented Generation) with chunked documents and vector search.
- 🧾 Connect Gaia insights to downstream tools (e.g., dashboards, auto-reporting bots).

## 📦 Requirements

- Python 3.8+
- Streamlit
- OpenSearch (running locally or remotely)
- Gaia Node (OpenAI-compatible endpoint, no API key required)

## ▶️ Run It

```bash
streamlit run app.py
```

Make sure OpenSearch is running and your Gaia node is available via a local URL.

Built with ❤️ using OpenSearch + Gaia for open, privacy-respecting AI-powered search & analytics.

## Resources

- Run your own [Gaia node](https://docs.gaianet.ai/getting-started/quick-start)
- Multiple large language models you can try: [huggingface.co/gaianet](https://huggingface.co/gaianet)
- Run your own [OpenSearch Instance](https://docs.opensearch.org/docs/latest/install-and-configure/install-opensearch/docker)
