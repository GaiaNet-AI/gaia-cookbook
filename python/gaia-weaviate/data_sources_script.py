#!/usr/bin/env python3
"""
Real-World Data Sources for Weaviate Knowledge Base

This script demonstrates how to fetch and process real data from various 
internet sources to create compelling RAG use cases.

Data Sources Included:
1. Wikipedia articles
2. ArXiv research papers
3. GitHub repositories
4. RSS feeds (news, blogs)
5. Reddit posts
6. Product documentation
7. FAQ datasets
8. Open datasets

Each source shows a different real-world use case for RAG systems.
"""

import os
import json
import time
import requests
import feedparser
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class DataSource:
    """Base class for data sources."""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    def fetch_data(self, **kwargs) -> List[Dict[str, Any]]:
        """Fetch data from the source. Override in subclasses."""
        raise NotImplementedError
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove common markdown/HTML artifacts
        text = re.sub(r'\[edit\]', '', text)  # Wikipedia edit links
        text = re.sub(r'<[^>]+>', '', text)   # HTML tags
        text = re.sub(r'\[\d+\]', '', text)   # Reference numbers
        
        return text
    
    def chunk_text(self, text: str, max_length: int = 1500) -> List[str]:
        """Split text into smaller chunks."""
        if len(text) <= max_length:
            return [text]
        
        # Split by sentences first
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= max_length:
                current_chunk += " " + sentence if current_chunk else sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks


class WikipediaSource(DataSource):
    """Fetch Wikipedia articles for comprehensive knowledge base."""
    
    def __init__(self):
        super().__init__("Wikipedia", "Wikipedia articles on various topics")
        self.base_url = "https://en.wikipedia.org/api/rest_v1/page/summary/"
        self.content_url = "https://en.wikipedia.org/w/api.php"
    
    def fetch_data(self, topics: List[str], **kwargs) -> List[Dict[str, Any]]:
        """Fetch Wikipedia articles for given topics."""
        documents = []
        
        for topic in topics:
            try:
                print(f"📖 Fetching Wikipedia article: {topic}")
                
                # Get article content
                params = {
                    'action': 'query',
                    'format': 'json',
                    'titles': topic,
                    'prop': 'extracts',
                    'exintro': False,
                    'explaintext': True,
                    'exsectionformat': 'plain'
                }
                
                response = requests.get(self.content_url, params=params, timeout=10)
                data = response.json()
                
                pages = data.get('query', {}).get('pages', {})
                for page_id, page_data in pages.items():
                    if 'extract' in page_data:
                        content = self.clean_text(page_data['extract'])
                        
                        # Split into chunks
                        chunks = self.chunk_text(content)
                        
                        for i, chunk in enumerate(chunks):
                            documents.append({
                                'title': f"{page_data['title']} (Part {i+1})" if len(chunks) > 1 else page_data['title'],
                                'content': chunk,
                                'source': f"wikipedia_{topic.lower().replace(' ', '_')}",
                                'category': 'encyclopedia',
                                'metadata': {
                                    'url': f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}",
                                    'topic': topic,
                                    'chunk_index': i,
                                    'total_chunks': len(chunks),
                                    'fetched_at': datetime.now().isoformat()
                                }
                            })
                
                time.sleep(0.5)  # Be respectful to Wikipedia's servers
                
            except Exception as e:
                print(f"❌ Error fetching Wikipedia article for {topic}: {e}")
        
        return documents


class ArXivSource(DataSource):
    """Fetch recent research papers from ArXiv."""
    
    def __init__(self):
        super().__init__("ArXiv", "Recent research papers from ArXiv")
        self.base_url = "http://export.arxiv.org/api/query"
    
    def fetch_data(self, search_terms: List[str], max_results: int = 5, **kwargs) -> List[Dict[str, Any]]:
        """Fetch ArXiv papers for given search terms."""
        documents = []
        
        for term in search_terms:
            try:
                print(f"🔬 Fetching ArXiv papers for: {term}")
                
                params = {
                    'search_query': f'all:{term}',
                    'start': 0,
                    'max_results': max_results,
                    'sortBy': 'submittedDate',
                    'sortOrder': 'descending'
                }
                
                response = requests.get(self.base_url, params=params, timeout=15)
                
                # Parse XML response
                root = ET.fromstring(response.content)
                namespace = {'atom': 'http://www.w3.org/2005/Atom'}
                
                for entry in root.findall('atom:entry', namespace):
                    title = entry.find('atom:title', namespace).text.strip()
                    summary = entry.find('atom:summary', namespace).text.strip()
                    
                    # Get authors
                    authors = []
                    for author in entry.findall('atom:author', namespace):
                        name = author.find('atom:name', namespace)
                        if name is not None:
                            authors.append(name.text)
                    
                    # Get published date
                    published = entry.find('atom:published', namespace).text
                    
                    # Get ArXiv ID
                    arxiv_id = entry.find('atom:id', namespace).text.split('/')[-1]
                    
                    content = self.clean_text(f"{title}\n\nAbstract: {summary}")
                    
                    documents.append({
                        'title': title,
                        'content': content,
                        'source': f'arxiv_{arxiv_id}',
                        'category': 'research',
                        'metadata': {
                            'authors': authors,
                            'published': published,
                            'arxiv_id': arxiv_id,
                            'url': f"https://arxiv.org/abs/{arxiv_id}",
                            'search_term': term,
                            'fetched_at': datetime.now().isoformat()
                        }
                    })
                
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                print(f"❌ Error fetching ArXiv papers for {term}: {e}")
        
        return documents


class GitHubSource(DataSource):
    """Fetch README files from popular GitHub repositories."""
    
    def __init__(self):
        super().__init__("GitHub", "README files from GitHub repositories")
        self.api_token = os.getenv('GITHUB_TOKEN', '')
        self.headers = {'Authorization': f'token {self.api_token}'} if self.api_token else {}
    
    def fetch_data(self, repos: List[str], **kwargs) -> List[Dict[str, Any]]:
        """Fetch README files from GitHub repositories."""
        documents = []
        
        for repo in repos:
            try:
                print(f"📂 Fetching GitHub README: {repo}")
                
                # Get repository info
                repo_url = f"https://api.github.com/repos/{repo}"
                repo_response = requests.get(repo_url, headers=self.headers, timeout=10)
                repo_data = repo_response.json()
                
                # Get README content
                readme_url = f"https://api.github.com/repos/{repo}/readme"
                readme_response = requests.get(readme_url, headers=self.headers, timeout=10)
                
                if readme_response.status_code == 200:
                    readme_data = readme_response.json()
                    
                    # Decode base64 content
                    import base64
                    content = base64.b64decode(readme_data['content']).decode('utf-8')
                    content = self.clean_text(content)
                    
                    # Split into chunks if too long
                    chunks = self.chunk_text(content)
                    
                    for i, chunk in enumerate(chunks):
                        documents.append({
                            'title': f"{repo_data['name']} Documentation {f'(Part {i+1})' if len(chunks) > 1 else ''}",
                            'content': chunk,
                            'source': f"github_{repo.replace('/', '_')}",
                            'category': 'documentation',
                            'metadata': {
                                'repository': repo,
                                'description': repo_data.get('description', ''),
                                'language': repo_data.get('language', ''),
                                'stars': repo_data.get('stargazers_count', 0),
                                'url': repo_data['html_url'],
                                'chunk_index': i,
                                'total_chunks': len(chunks),
                                'fetched_at': datetime.now().isoformat()
                            }
                        })
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"❌ Error fetching GitHub repo {repo}: {e}")
        
        return documents


class RSSFeedSource(DataSource):
    """Fetch recent articles from RSS feeds."""
    
    def __init__(self):
        super().__init__("RSS Feeds", "Recent articles from RSS feeds")
    
    def fetch_data(self, feeds: List[Dict[str, str]], max_articles: int = 10, **kwargs) -> List[Dict[str, Any]]:
        """Fetch articles from RSS feeds."""
        documents = []
        
        for feed_info in feeds:
            try:
                feed_url = feed_info['url']
                feed_name = feed_info['name']
                category = feed_info.get('category', 'news')
                
                print(f"📰 Fetching RSS feed: {feed_name}")
                
                feed = feedparser.parse(feed_url)
                
                for entry in feed.entries[:max_articles]:
                    # Get content
                    content = ""
                    if hasattr(entry, 'content'):
                        content = entry.content[0].value
                    elif hasattr(entry, 'summary'):
                        content = entry.summary
                    elif hasattr(entry, 'description'):
                        content = entry.description
                    
                    content = self.clean_text(content)
                    
                    # Skip if content is too short
                    if len(content) < 100:
                        continue
                    
                    documents.append({
                        'title': entry.title,
                        'content': content,
                        'source': f"rss_{feed_name.lower().replace(' ', '_')}",
                        'category': category,
                        'metadata': {
                            'feed_name': feed_name,
                            'feed_url': feed_url,
                            'article_url': entry.link,
                            'published': entry.get('published', ''),
                            'author': entry.get('author', ''),
                            'fetched_at': datetime.now().isoformat()
                        }
                    })
                
                time.sleep(0.5)
                
            except Exception as e:
                print(f"❌ Error fetching RSS feed {feed_info['name']}: {e}")
        
        return documents


class ProductDocumentationSource(DataSource):
    """Fetch documentation from popular APIs and services."""
    
    def __init__(self):
        super().__init__("Product Documentation", "API and product documentation")
    
    def fetch_data(self, doc_configs: List[Dict[str, str]], **kwargs) -> List[Dict[str, Any]]:
        """Fetch documentation from various sources."""
        documents = []
        
        for config in doc_configs:
            try:
                print(f"📚 Fetching documentation: {config['name']}")
                
                response = requests.get(config['url'], timeout=15)
                
                if response.status_code == 200:
                    # Handle different content types
                    if config.get('type') == 'json':
                        data = response.json()
                        content = json.dumps(data, indent=2)
                    else:
                        content = response.text
                    
                    content = self.clean_text(content)
                    chunks = self.chunk_text(content, max_length=2000)
                    
                    for i, chunk in enumerate(chunks):
                        documents.append({
                            'title': f"{config['name']} Documentation {f'(Part {i+1})' if len(chunks) > 1 else ''}",
                            'content': chunk,
                            'source': f"docs_{config['name'].lower().replace(' ', '_')}",
                            'category': 'documentation',
                            'metadata': {
                                'doc_source': config['name'],
                                'original_url': config['url'],
                                'doc_type': config.get('type', 'text'),
                                'chunk_index': i,
                                'total_chunks': len(chunks),
                                'fetched_at': datetime.now().isoformat()
                            }
                        })
                
                time.sleep(0.5)
                
            except Exception as e:
                print(f"❌ Error fetching documentation {config['name']}: {e}")
        
        return documents


def get_tech_news_sources():
    """Popular tech news RSS feeds."""
    return [
        {'name': 'TechCrunch', 'url': 'https://techcrunch.com/feed/', 'category': 'tech_news'},
        {'name': 'Hacker News', 'url': 'https://hnrss.org/frontpage', 'category': 'tech_news'},
        {'name': 'AI News', 'url': 'https://artificialintelligence-news.com/feed/', 'category': 'ai_news'},
        {'name': 'VentureBeat AI', 'url': 'https://venturebeat.com/ai/feed/', 'category': 'ai_news'},
    ]


def get_ai_research_topics():
    """Popular AI research topics for ArXiv."""
    return [
        'large language models',
        'retrieval augmented generation',
        'vector databases',
        'transformers',
        'machine learning',
        'neural networks',
        'artificial intelligence'
    ]


def get_wikipedia_ai_topics():
    """AI-related Wikipedia topics."""
    return [
        'Artificial intelligence',
        'Machine learning',
        'Large language model',
        'Transformer (machine learning model)',
        'Vector database',
        'Retrieval-augmented generation',
        'OpenAI',
        'GPT-3',
        'Neural network',
        'Deep learning'
    ]


def get_popular_ai_repos():
    """Popular AI/ML GitHub repositories."""
    return [
        'openai/openai-python',
        'weaviate/weaviate',
        'microsoft/semantic-kernel',
        'langchain-ai/langchain',
        'run-llama/llama_index',
        'huggingface/transformers',
        'anthropics/anthropic-sdk-python',
        'GaiaNet-AI/gaianet-node'
    ]


def get_documentation_sources():
    """API documentation sources."""
    return [
        {
            'name': 'OpenAI API Reference',
            'url': 'https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml',
            'type': 'yaml'
        },
        {
            'name': 'Weaviate API Concepts',
            'url': 'https://raw.githubusercontent.com/weaviate/weaviate/master/README.md',
            'type': 'markdown'
        }
    ]


def create_comprehensive_knowledge_base():
    """Create a comprehensive knowledge base from multiple real sources."""
    print("🌐 Creating Comprehensive Knowledge Base from Internet Sources")
    print("=" * 70)
    
    all_documents = []
    
    # 1. Wikipedia Articles
    print("\n📖 Fetching Wikipedia articles...")
    wiki_source = WikipediaSource()
    wiki_docs = wiki_source.fetch_data(get_wikipedia_ai_topics())
    all_documents.extend(wiki_docs)
    print(f"✅ Added {len(wiki_docs)} Wikipedia documents")
    
    # 2. ArXiv Research Papers
    print("\n🔬 Fetching ArXiv research papers...")
    arxiv_source = ArXivSource()
    arxiv_docs = arxiv_source.fetch_data(get_ai_research_topics(), max_results=3)
    all_documents.extend(arxiv_docs)
    print(f"✅ Added {len(arxiv_docs)} ArXiv documents")
    
    # 3. GitHub Documentation
    print("\n📂 Fetching GitHub documentation...")
    github_source = GitHubSource()
    github_docs = github_source.fetch_data(get_popular_ai_repos())
    all_documents.extend(github_docs)
    print(f"✅ Added {len(github_docs)} GitHub documents")
    
    # 4. Tech News RSS Feeds
    print("\n📰 Fetching tech news...")
    rss_source = RSSFeedSource()
    news_docs = rss_source.fetch_data(get_tech_news_sources(), max_articles=5)
    all_documents.extend(news_docs)
    print(f"✅ Added {len(news_docs)} news articles")
    
    # 5. Product Documentation
    print("\n📚 Fetching product documentation...")
    doc_source = ProductDocumentationSource()
    doc_docs = doc_source.fetch_data(get_documentation_sources())
    all_documents.extend(doc_docs)
    print(f"✅ Added {len(doc_docs)} documentation documents")
    
    print(f"\n🎉 Total documents collected: {len(all_documents)}")
    
    # Save to JSON for inspection
    output_file = 'knowledge_base_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_documents, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Data saved to {output_file}")
    
    # Print summary statistics
    categories = {}
    sources = {}
    for doc in all_documents:
        cat = doc['category']
        src = doc['source'].split('_')[0]
        categories[cat] = categories.get(cat, 0) + 1
        sources[src] = sources.get(src, 0) + 1
    
    print(f"\n📊 Content Summary:")
    print(f"Categories: {dict(categories)}")
    print(f"Sources: {dict(sources)}")
    
    return all_documents


def demonstrate_use_cases():
    """Demonstrate different RAG use cases with real data."""
    print("\n🎯 RAG Use Case Demonstrations")
    print("=" * 50)
    
    use_cases = [
        {
            "name": "Technical Support Bot",
            "description": "Answer questions about AI tools and frameworks",
            "sample_queries": [
                "How do I use OpenAI's API?",
                "What is Weaviate and how does it work?",
                "How to implement RAG with LangChain?"
            ]
        },
        {
            "name": "Research Assistant",
            "description": "Help with AI research and recent developments",
            "sample_queries": [
                "What are the latest developments in large language models?",
                "How does retrieval augmented generation work?",
                "What are the current trends in AI research?"
            ]
        },
        {
            "name": "News and Trend Analysis",
            "description": "Analyze tech news and industry trends",
            "sample_queries": [
                "What are the recent AI news and developments?",
                "What companies are leading in AI innovation?",
                "What are the current challenges in AI deployment?"
            ]
        },
        {
            "name": "Educational Content Creator",
            "description": "Generate educational content about AI topics",
            "sample_queries": [
                "Explain machine learning to beginners",
                "What are neural networks and how do they work?",
                "Compare different AI model architectures"
            ]
        }
    ]
    
    for use_case in use_cases:
        print(f"\n🔧 {use_case['name']}")
        print(f"Description: {use_case['description']}")
        print("Sample queries:")
        for query in use_case['sample_queries']:
            print(f"  • {query}")


if __name__ == "__main__":
    print("🌐 Internet Data Sources for RAG Knowledge Base")
    print("=" * 60)
    
    # Create comprehensive knowledge base
    documents = create_comprehensive_knowledge_base()
    
    # Demonstrate use cases
    demonstrate_use_cases()
    
    print(f"\n💡 Next Steps:")
    print(f"1. Review the generated knowledge_base_data.json file")
    print(f"2. Use this data with your Gaia + Weaviate integration")
    print(f"3. Test the RAG queries with real-world data")
    print(f"4. Customize data sources for your specific use case")
    
    print(f"\n🔧 Integration Example:")
    print(f"""
# Load and use the data in your main application
import json
from corrected_integration import GaiaWeaviateIntegration, Config

# Load the fetched data
with open('knowledge_base_data.json', 'r') as f:
    documents = json.load(f)

# Initialize integration
config = Config()
integration = GaiaWeaviateIntegration(config)

# Add documents to Weaviate
integration.add_documents(documents, "RealWorldKnowledgeBase")

# Test RAG queries
result = integration.rag_query("What is retrieval augmented generation?")
print(result['response'])
""")