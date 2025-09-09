import os
from typing import Literal
from tavily import TavilyClient
from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

# Initialize Gaia node client (OpenAI-compatible API)
def create_gaia_client():
    """Create a Gaia node client with tool calling capabilities"""
    return ChatOpenAI(
        api_key=os.environ.get("GAIANET_API_KEY"),
        model="Qwen3-4B-Q5_K_M",
        base_url=os.environ.get("GAIANET_BASE_URL", "gaia-node-url/v1")
    )

# Initialize Tavily for web search
tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

# Gaia location tools (assuming Gaia node supports these functions)
def location_search(query: str, max_results: int = 10):
    """Search for locations using Gaia node's location intelligence"""
    gaia_client = create_gaia_client()
    response = gaia_client.invoke(f"LOCATION_SEARCH:{query}:{max_results}")
    return response.content

def location_context(location_id: str):
    """Get contextual information about a specific location"""
    gaia_client = create_gaia_client()
    response = gaia_client.invoke(f"LOCATION_CONTEXT:{location_id}")
    return response.content

def journey_planning(origin: str, destination: str, mode: str = "driving"):
    """Plan routes between locations"""
    gaia_client = create_gaia_client()
    response = gaia_client.invoke(f"JOURNEY_PLAN:{origin}:{destination}:{mode}")
    return response.content

def spatial_relationships(location1: str, location2: str):
    """Understand spatial relationships between locations"""
    gaia_client = create_gaia_client()
    response = gaia_client.invoke(f"SPATIAL_REL:{location1}:{location2}")
    return response.content

def internet_search(
    query: str,
    max_results: int = 5,
    topic: Literal["general", "news", "finance"] = "general",
    include_raw_content: bool = False,
):
    """
    Run a web search to find current information and context.
    
    Use this for general research, news, reviews, and background information
    that complements location data.
    """
    try:
        result = tavily_client.search(
            query,
            max_results=max_results,
            include_raw_content=include_raw_content,
            topic=topic,
        )
        return str(result)  # Convert to string for better handling
    except Exception as e:
        return f"Web search error: {str(e)}"

# Define the agent's research methodology
research_instructions = """You are an expert location researcher and travel advisor. 

Your mission is to provide comprehensive, actionable insights about places, businesses, and locations.

## Your Tools

You have access to multiple Gaia location intelligence tools:

**`location_search`**: General location search for finding places, businesses, restaurants, hotels, attractions, etc. This tool understands natural language queries like "coffee shops in downtown Seattle" or "family restaurants near Central Park."

**`location_context`**: Get contextual information about a specific location or area.

**`journey_planning`**: Plan routes and journeys between multiple locations.

**`spatial_relationships`**: Understand spatial relationships between locations.

**`internet_search`**: Use this for gathering additional context, reviews, recent news, opening hours, pricing, or any supplementary information about locations you've found.

## Research Methodology

1. **Location Discovery**: Start with Gaia location tools to find relevant places
2. **Context Gathering**: Use internet_search to get reviews, recent information, and context
3. **Synthesis**: Combine location data with web research for comprehensive insights
4. **Recommendations**: Provide specific, actionable recommendations with reasoning

## Output Format

Structure your responses as:
- **Summary**: Brief overview of findings
- **Top Recommendations**: 3-5 specific places with details
- **Insights**: Key patterns, trends, or notable findings
- **Practical Tips**: Hours, pricing, reservation info, etc.

Always cite your sources and be specific about locations, addresses, and practical details.
"""

# Create the location-aware research agent with Gaia tools
agent = create_deep_agent(
    tools=[
        location_search, 
        location_context, 
        journey_planning, 
        spatial_relationships, 
        internet_search
    ],
    instructions=research_instructions,
    # Use Gaia node as the model
    model=create_gaia_client(),
)

# Example usage
if __name__ == "__main__":
    queries = [
        "What are the best coffee shops in Paris?",
        "Find family-friendly restaurants near Golden Gate Bridge",
        "Research the startup ecosystem around MIT"
    ]
    
    for query in queries:
        print(f"\n🔍 Query: {query}")
        print("=" * 50)
        
        result = agent.invoke({
            "messages": [{"role": "user", "content": query}]
        })
        
        # Correct way to access the response content
        last_message = result['messages'][-1]
        print(f"Response: {last_message.content}")
        print("\n" + "-" * 50)

# Advanced use cases with proper error handling
def run_agent_query(query: str):
    """Run a query with proper error handling"""
    try:
        result = agent.invoke({
            "messages": [{"role": "user", "content": query}]
        })
        last_message = result['messages'][-1]
        return last_message.content
    except Exception as e:
        return f"Error processing query: {str(e)}"

def travel_planning_agent():
    """Agent for comprehensive travel planning"""
    travel_query = """
    Plan a perfect day in San Francisco for a tech entrepreneur visiting for the first time. 
    Include must-see tech landmarks, great coffee shops for meetings, and dinner recommendations.
    """
    
    return run_agent_query(travel_query)

def market_research_agent():
    """Agent for location-based market analysis"""
    market_query = """
    Analyze the restaurant scene in Brooklyn's DUMBO neighborhood. 
    What types of cuisines are popular? Any gaps in the market?
    """
    
    return run_agent_query(market_query)

def real_estate_analysis_agent():
    """Agent for real estate location evaluation"""
    real_estate_query = """
    Evaluate the amenities and walkability around 123 Main St, Boston. 
    What restaurants, shops, and services are within walking distance?
    """
    
    return run_agent_query(real_estate_query)

# If you want to test the advanced use cases:
if __name__ == "__main__":
    # Test advanced queries
    print("\n🚀 Testing Travel Planning Agent:")
    print("=" * 50)
    travel_result = travel_planning_agent()
    print(travel_result)