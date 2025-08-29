# 🚀 Gaia × DIA Data AI Assistant

This project is an exciting demonstration of how Artificial Intelligence can answer your financial questions by intelligently interacting with real-time data sources. It functions as your personal financial analyst, equipped with access to a vast, constantly updated financial data library.

Specifically, this application showcases the integration of **Gaia Nodes** (your own local Large Language Models) with **DIA Data APIs** for comprehensive cross-asset financial analysis, leveraging the power of **AI Tool Calling**.

<img width="733" height="297" alt="image" src="https://github.com/user-attachments/assets/60ad2d3f-01e6-4c65-852f-0e2fd7231d50" />
<img width="1744" height="1209" alt="image" src="https://github.com/user-attachments/assets/a0effa07-c323-4595-b240-d0a6efb8a43c" />
<img width="1647" height="1198" alt="image" src="https://github.com/user-attachments/assets/60f35fab-7c8e-4821-992a-b1028d6864d7" />
![gaia-dia](https://github.com/user-attachments/assets/5d03b2b2-3368-4b03-8d37-5bdb3d08463f)


## ✨ What Does This Project Do?

This web application empowers you to:

*   **Ask financial questions** in natural language (e.g., "What is the current price of Bitcoin and the EUR-USD exchange rate?").
*   Receive **real-time answers** concerning cryptocurrencies, foreign exchange (forex), commodities (like gold), and Exchange-Traded Funds (ETFs, such as S&P 500 funds).
*   Perform instant **portfolio value calculations** for diversified assets.
*   **Configure and utilize your own local AI model** (hosted on a Gaia Node), ensuring enhanced privacy and control over your data.
*   Visualize **which "tools" the AI employed** to retrieve the requested information, offering transparency into its process.

## 🧠 How It Works (Simplified Explanation)

Imagine you have a highly intelligent assistant: your **AI model, running locally on a Gaia Node**. This assistant is smart but doesn't have all financial data inherently memorized. However, it possesses a unique "toolbelt" containing detailed instructions on how to use various financial data services.

Here’s the step-by-step process:

1.  **You Ask:** You type a question into the chat interface, for instance, "What is the current price of gold?"
2.  **AI Thinks (Initial Stage):** Your Gaia Node AI model receives your question. It quickly processes the request and determines, "I don't have this specific data stored. I need to use a tool!"
3.  **AI Selects a Tool:** The AI consults its internal toolbelt and identifies the appropriate "Commodity Price" tool, which is designed to connect with the **DIA Data API** for commodity prices.
4.  **AI Crafts a Tool Request:** The AI then formulates a precise request for that tool, specifying the necessary parameters (e.g., asking for the "XAU-USD" symbol for gold).
5.  **Backend Acts as Messenger:** Our Node.js server serves as the crucial intermediary. It receives the AI's tool request, forwards it to the actual DIA Data API, retrieves the real-time gold price, and then relays this data *back* to the AI.
6.  **AI Thinks (Final Stage):** With the real-time gold price now available, the AI processes this raw data and synthesizes it into a clear, user-friendly answer.
7.  **You Receive the Answer:** The AI's comprehensive response, such as, "The current price of gold (XAU-USD) is $X,XXX.XX," is then displayed in your web browser.

**In essence:** You pose a question, the AI determines and calls the relevant external data `tool` (provided by DIA Data), our server fetches that data, and finally, the AI processes and summarizes it into an easy-to-understand response for you.

## 🛠️ Prerequisites

Before you can run this project, ensure you have the following installed and set up:

1.  **Node.js and npm (or yarn):** These are essential for running the backend server.
    *   Download and install from [nodejs.org](https://nodejs.org/).
2.  **A Running Gaia Node (Local LLM Server):** This is the core component where your AI model will operate.
    *   Ensure your Gaia Node is accessible at the URL you intend to configure (commonly `https://YOUR_NODE_ID.gaia.domains`).
3.  **Internet Access:** The Node.js server requires internet connectivity to communicate with the external DIA Data API.

## 🚀 Getting Started

Follow these steps to set up and run the project on your local machine:

1.  **Clone the Repository:**
    Open your terminal or command prompt and execute:
    ```bash
    git clone [your-repository-url]
    cd gaia-dia
    ```

2.  **Install Dependencies:**
    Navigate into the project directory and install all necessary Node.js packages:
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables (Optional but Recommended):**
    Create a new file named `.env` in the root directory of your project. This file allows you to define default values for your Gaia Node URL, preferred AI model, and an API key (if your Gaia Node requires authentication).

    Example `.env` file content:
    ```env
    # .env example
    GAIA_NODE_URL=http://localhost:8080
    DEFAULT_MODEL=llama3
    GAIA_API_KEY=your_optional_api_key # Only required if you're using a Public Gaia Domain
    ```
    *If you choose not to create a `.env` file, the server will default to `http://localhost:8080` for the Gaia Node URL and `gpt-4` as the default model.*

4.  **Start Your Gaia Node:**
    Ensure your Gaia Node is actively running and accessible at the URL you've configured.

5.  **Start the Backend Server:**
    In your project's terminal window, run the Node.js server:
    ```bash
    node server.js
    ```
    You should observe output similar to this, indicating the server has started successfully:
    ```
    🚀 Gaia-DIA Integration Server running on port 3000
    📊 Visit http://localhost:3000 to start chatting
    🔧 Configuration:
       - Default Gaia Node URL: http://localhost:8080
       - Default Model: llama3
       - API Key configured: false
    🔧 API endpoints:
       - POST /api/chat - Main chat interface
       - GET /api/config - Get environment configuration
       - POST /api/test-gaia - Test Gaia Node connectivity
       - GET /api/tools - Available DIA Data tools
       - GET /api/test-dia - Test DIA API connectivity
       - GET /api/health - Health check
    
    💡 Using OpenAI Node.js SDK for Gaia Node communication
    ```

6.  **Open the Web Application:**
    Launch your preferred web browser and navigate to the following address:
    ```
    http://localhost:3000
    ```

## ⚙️ Configuration in the User Interface

Once the application loads in your browser, pay attention to the "Gaia Node Configuration" panel:

1.  **Gaia Node URL:** This field will automatically populate based on your `.env` settings or a default. If your Gaia Node is running on a different port or host, update this field accordingly. Changes will trigger a re-fetch of available models.
2.  **Model:** This dropdown is **dynamically populated** with the actual model IDs available directly from your connected Gaia Node (by querying its `/v1/models` endpoint). Select the specific AI model you wish to use for chat interactions.
3.  **API Key (Optional):** If your Gaia Node requires an API key for authentication, input it here. Otherwise, leave this field blank. Changes will also trigger a re-fetch of available models.
4.  **Temperature:** Use this slider to adjust the AI's "creativity" or determinism (0.0 for more predictable responses, 1.0 for more varied and "imaginative" ones).

After configuring these settings, click the **"Test Connection"** button to verify that the frontend can successfully communicate with your Gaia Node. Upon a successful connection, you're ready to start chatting!

## 💬 Usage

*   Utilize the **quick action cards** for convenient pre-filled example questions.
*   Type your financial questions into the input box located at the bottom of the chat interface.
*   Here are some examples of questions you can ask:
    *   "What is the current price of Bitcoin?"
    *   "What's the exchange rate between EUR and USD?"
    *   "How much is an ounce of gold right now?"
    *   "What's the price of the IVV ETF?"
    *   "Tell me the total value of 1.5 BTC, 500 EUR, 2 oz silver, and 50 EEM ETF shares."

The AI will process your request, dynamically use the appropriate DIA Data tools, and provide a detailed, human-readable answer. You will see visual indicators in the chat history showing which tools were invoked and the token usage for each interaction.

## 💻 Key Technologies Used

*   **Frontend:** HTML, CSS (TailwindCSS framework), JavaScript
*   **Backend:** Node.js, Express.js (for building the web server), Axios (for making HTTP requests to external APIs)
*   **AI Integration Library:** OpenAI Node.js SDK (used to communicate with any OpenAI-compatible API endpoint, like those exposed by Gaia Nodes)
*   **AI Backend:** Gaia Nodes (your self-hosted LLM server solution)
*   **Real-time Financial Data Source:** DIA Data API

## 🚨 Troubleshooting

*   **"Cannot connect to Gaia Node"**:
    *   Verify the **Gaia Node URL** entered in the UI's configuration panel is correct.
    *   Confirm that your **Gaia Node** is actively running.
    *   Check if your specific Gaia Node setup requires an **API Key** and ensure it's accurately entered.
    *   Examine your Node.js server console for more specific error messages related to the connection attempt.
*   **"Failed to load models" in the dropdown**:
    *   This typically indicates that the application could not successfully retrieve the list of models from your Gaia Node's `/v1/models` endpoint. Re-check the Gaia Node URL and API key for any typos or configuration issues.
*   **AI responds with raw tool code, incomplete text, or nothing**:
    *   This may occur if the LLM, after executing tools, fails to format its final response into natural language. The backend includes robust fallback logic to generate a readable summary, but in rare cases, extremely unusual LLM behavior might still result in odd output.
    *   Review the backend server logs for the line "Final response content from LLM:" to see the exact response received from the AI model.
    *   Consider trying a different AI model from the dropdown, as some models are better at following instructions for natural language output after tool use.
