import os
from haystack.components.agents import Agent
from haystack.tools.component_tool import ComponentTool
from haystack.components.websearch import SerperDevWebSearch
from haystack.dataclasses import ChatMessage
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.utils import Secret
from dotenv import load_dotenv
load_dotenv()

# Create the web search component
web_search = SerperDevWebSearch(api_key=Secret.from_env_var("SERPERDEV_API_KEY"), top_k=3)

# Create the ComponentTool
web_tool = ComponentTool(
    component=web_search,
    name="web_search",
    description="Use this tool to search the web for current information like weather, news, or facts. Always use this tool when asked about current information."
)

# Configure Gaia Node connection using environment variables
chat_generator = OpenAIChatGenerator(
    api_key=Secret.from_env_var("GAIA_API_KEY"),  # Use Secret wrapper for API key
    api_base_url=os.getenv("GAIA_NODE_URL"),
    model=os.getenv("GAIA_MODEL_NAME", "llama3b")
)

# Create the agent with the web tool
tool_calling_agent = Agent(
    chat_generator=chat_generator,
    system_prompt="""You are a helpful agent with access to web search capabilities. 
                     When asked about current information like weather, news, facts, or any real-time data,
                     you MUST use the web_search tool to find the information first.
                     After getting web search results, extract the relevant information and present it clearly.
                     Do not claim you cannot access current information - you can use the web_search tool.""",
    tools=[web_tool]
)

# Run the agent with the user message
user_message = ChatMessage.from_user("How is the weather in Berlin?")
result = tool_calling_agent.run(messages=[user_message])

# Print the result
response = result["messages"][-1].text
print(f"Agent response: {response}")

# Check if the agent generated a tool call and execute it manually
if "tool_call" in response.lower() and "web_search" in response:
    print("\nAgent requested web search, executing manually...")
    search_result = web_search.run(query="weather in Berlin today")
    
    if search_result and "documents" in search_result:
        print("\nSearch Results:")
        for i, doc in enumerate(search_result["documents"][:2]):
            print(f"{i+1}. {doc.meta.get('title', 'Unknown Source')}")
            print(f"   {doc.content[:200]}...\n")
        
        # Generate a follow-up response with the search results
        context = "\n".join([f"{doc.meta.get('title', 'Unknown')}: {doc.content}" for doc in search_result["documents"][:3]])
        
        followup_messages = [
            ChatMessage.from_system("You are a helpful assistant. Use the provided search results to answer about the weather."),
            ChatMessage.from_user(f"Based on these search results about Berlin weather, provide a summary:\n\n{context}")
        ]
        
        # Try to generate a summary (without tools this time)
        try:
            summary_generator = OpenAIChatGenerator(
                api_key=Secret.from_env_var("GAIA_API_KEY"),
                api_base_url=os.getenv("GAIA_NODE_URL"),
                model=os.getenv("GAIA_MODEL_NAME", "llama3b")
            )
            summary_result = summary_generator.run(messages=followup_messages)
            print("\nWeather Summary:")
            print(summary_result["replies"][0].content[0].text)
        except Exception as e:
            print(f"\nCouldn't generate summary, but here are the raw results above. Error: {e}")