import os
from typing import Literal
from tavily import TavilyClient
from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from camino_ai import CaminoAI, APIError

load_dotenv()

# Initialize all API clients
def create_gaia_client():
    """Create a Gaia node client with tool calling capabilities"""
    return ChatOpenAI(
        api_key=os.environ.get("GAIANET_API_KEY"),
        model="Qwen3-4B-Q5_K_M",
        base_url=os.environ.get("GAIANET_BASE_URL", "gaia-node-url/v1"),
        temperature=0.1
    )

# Initialize clients
tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
camino_client = CaminoAI(api_key=os.environ.get("CAMINO_API_KEY"))
gaia_client = create_gaia_client()

# Gaia location tools
def gaia_location_search(query: str, max_results: int = 10):
    """Search for locations using Gaia node's location intelligence"""
    try:
        response = gaia_client.invoke(f"LOCATION_SEARCH:{query}:{max_results}")
        return response.content
    except Exception as e:
        return f"Gaia search error: {str(e)}"

def gaia_location_context(location_id: str):
    """Get contextual information about a specific location using Gaia"""
    try:
        response = gaia_client.invoke(f"LOCATION_CONTEXT:{location_id}")
        return response.content
    except Exception as e:
        return f"Gaia context error: {str(e)}"

# Camino AI tools (from the original blog post)
def camino_search(query: str, **kwargs):
    """Camino AI search with error handling"""
    try:
        return camino_client.search(query, **kwargs)
    except APIError as e:
        return f"Camino search error: {str(e)}"
    except Exception as e:
        return f"Unexpected error in Camino search: {str(e)}"

def camino_query(query: str, **kwargs):
    """Camino AI query with error handling"""
    try:
        return camino_client.query(query, **kwargs)
    except APIError as e:
        return f"Camino query error: {str(e)}"
    except Exception as e:
        return f"Unexpected error in Camino query: {str(e)}"

def camino_context(location: str, **kwargs):
    """Camino AI context with error handling"""
    try:
        return camino_client.context(location, **kwargs)
    except APIError as e:
        return f"Camino context error: {str(e)}"
    except Exception as e:
        return f"Unexpected error in Camino context: {str(e)}"

def camino_journey(origin: str, destination: str, **kwargs):
    """Camino AI journey planning with error handling"""
    try:
        return camino_client.journey(origin, destination, **kwargs)
    except APIError as e:
        return f"Camino journey error: {str(e)}"
    except Exception as e:
        return f"Unexpected error in Camino journey: {str(e)}"

def camino_relationship(location1: str, location2: str, **kwargs):
    """Camino AI relationship analysis with error handling"""
    try:
        return camino_client.relationship(location1, location2, **kwargs)
    except APIError as e:
        return f"Camino relationship error: {str(e)}"
    except Exception as e:
        return f"Unexpected error in Camino relationship: {str(e)}"

def internet_search(
    query: str,
    max_results: int = 5,
    topic: Literal["general", "news", "finance"] = "general",
    include_raw_content: bool = False,
):
    """
    Run a web search to find current information and context.
    """
    try:
        result = tavily_client.search(
            query,
            max_results=max_results,
            include_raw_content=include_raw_content,
            topic=topic,
        )
        return str(result)
    except Exception as e:
        return f"Web search error: {str(e)}"

# Define the advanced research methodology
research_instructions = """You are an expert location intelligence analyst with access to multiple AI systems.

## Available Intelligence Systems

1. **Gaia Node**: Fast, efficient location search and basic context
2. **Camino AI**: Advanced location intelligence with spatial reasoning
3. **Web Search**: Real-time information, reviews, and current data

## Tool Selection Strategy

**Use Gaia Node for:**
- Quick initial location discovery
- Basic context gathering
- High-volume simple queries

**Use Camino AI for:**
- Complex spatial reasoning
- Journey planning and routing
- Relationship analysis between locations
- Advanced ranking and filtering

**Use Web Search for:**
- Current reviews and ratings
- Opening hours and pricing
- Recent news and events
- Supplementary context

## Research Methodology

1. **Initial Discovery**: Use Gaia for quick location identification
2. **Deep Analysis**: Use Camino for spatial intelligence and relationships  
3. **Context Enrichment**: Use web search for real-world validation
4. **Synthesis**: Combine insights from all sources

## Output Format

- **Executive Summary**: High-level overview
- **Location Intelligence**: Spatial insights and relationships
- **Practical Details**: Hours, pricing, accessibility
- **Recommendations**: Data-driven suggestions with reasoning
- **Sources**: Clear attribution to each AI system used
"""

# Create the multi-AI location research agent
agent = create_deep_agent(
    tools=[
        # Gaia tools
        gaia_location_search,
        gaia_location_context,
        
        # Camino AI tools
        camino_search,
        camino_query,
        camino_context,
        camino_journey,
        camino_relationship,
        
        # Web search
        internet_search
    ],
    instructions=research_instructions,
    model=gaia_client,  # Use Gaia as the primary model
)

# Specialized sub-agents for different use cases
def create_travel_agent():
    """Specialized agent for travel planning"""
    travel_instructions = """You are a luxury travel concierge specializing in personalized itineraries.

Focus on:
- Seamless journey planning between locations
- Premium experiences and hidden gems
- Practical logistics and timing
- Local insights and cultural context

Use Gaia for quick location finding, Camino for optimal routing, and web search for current reviews.
"""
    
    return create_deep_agent(
        tools=[
            gaia_location_search,
            camino_query,
            camino_journey,
            camino_context,
            internet_search
        ],
        instructions=travel_instructions,
        model=gaia_client,
    )

def create_real_estate_agent():
    """Specialized agent for real estate analysis"""
    real_estate_instructions = """You are a real estate location analyst specializing in property valuation through location intelligence.

Focus on:
- Walkability scores and amenity access
- Transportation connectivity
- Neighborhood safety and demographics
- Property value correlations with location features

Use Camino for spatial relationships and Gaia for area context.
"""
    
    return create_deep_agent(
        tools=[
            camino_query,
            camino_relationship,
            camino_context,
            gaia_location_context,
            internet_search
        ],
        instructions=real_estate_instructions,
        model=gaia_client,
    )

# Example usage with multi-AI integration
if __name__ == "__main__":
    print("🌍 Multi-AI Location Intelligence System")
    print("=" * 60)
    
    # Test queries that benefit from multiple AI systems
    test_queries = [
        "Plan a tech startup tour in San Francisco with optimal routing between locations",
        "Analyze walkability and amenities around potential office locations in downtown Austin",
        "Find the best coffee shops for remote work in Paris with good transportation access"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n🔍 Query {i}: {query}")
        print("=" * 60)
        
        try:
            result = agent.invoke({
                "messages": [{"role": "user", "content": query}]
            })
            
            last_message = result['messages'][-1]
            print(f"📋 Response:\n{last_message.content}")
            print("\n" + "-" * 60)
            
        except Exception as e:
            print(f"❌ Error processing query: {str(e)}")
            print("\n" + "-" * 60)

# Advanced multi-AI analysis functions
def multi_ai_location_analysis(query: str):
    """Run analysis using all available AI systems"""
    try:
        result = agent.invoke({
            "messages": [{"role": "user", "content": query}]
        })
        return result['messages'][-1].content
    except Exception as e:
        return f"Analysis error: {str(e)}"

def comparative_location_analysis(location1: str, location2: str, analysis_type: str):
    """Compare two locations using multiple AI systems"""
    query = f"""
    Comparative analysis between {location1} and {location2} for {analysis_type}.
    Include spatial relationships, accessibility, amenities, and overall suitability.
    """
    
    return multi_ai_location_analysis(query)

# Example specialized analyses
if __name__ == "__main__":
    print("\n🚀 Advanced Multi-AI Analyses")
    print("=" * 60)
    
    # Comparative analysis example
    print("\n🏢 Comparative Office Location Analysis:")
    print("=" * 40)
    comparison = comparative_location_analysis(
        "SoMa San Francisco", 
        "Mission District San Francisco",
        "tech startup office location"
    )
    print(comparison)
    
    # Travel planning with specialized agent
    print("\n✈️ Specialized Travel Planning:")
    print("=" * 40)
    travel_agent = create_travel_agent()
    travel_result = travel_agent.invoke({
        "messages": [{"role": "user", "content": "Luxury weekend in Napa Valley with wine tours and fine dining"}]
    })
    print(travel_result['messages'][-1].content)