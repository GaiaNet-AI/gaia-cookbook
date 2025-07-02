#!/usr/bin/env python3
"""
Real-World RAG Demo with Internet Data

This script demonstrates a complete RAG pipeline using real data from the internet:
1. Fetches current data from multiple sources
2. Processes and chunks the content
3. Stores in Weaviate vector database
4. Demonstrates various RAG use cases with your Gaia node

Use Cases Demonstrated:
- AI Research Assistant
- Technical Documentation Helper
- News and Trends Analyzer
- Educational Content Generator
"""

import os
import json
import time
from datetime import datetime
from typing import List, Dict, Any
import requests
import feedparser
from dotenv import load_dotenv

# Import our existing integration
from app import GaiaWeaviateIntegration, Config
from data_sources_script import (
    WikipediaSource, ArXivSource, GitHubSource, RSSFeedSource,
    get_ai_research_topics, get_wikipedia_ai_topics, get_popular_ai_repos, get_tech_news_sources
)

# Load environment variables
load_dotenv()


class RealWorldRAGDemo:
    """Comprehensive RAG demonstration with real internet data."""
    
    def __init__(self):
        """Initialize the demo with configuration."""
        self.config = Config()
        self.integration = GaiaWeaviateIntegration(self.config)
        self.collection_name = "RealWorldKnowledgeBase"
        self.demo_queries = self._get_demo_queries()
    
    def _get_demo_queries(self) -> Dict[str, List[str]]:
        """Get demonstration queries for different use cases."""
        return {
            "AI Research Assistant": [
                "What are the latest developments in large language models?",
                "How does retrieval augmented generation work?",
                "What are transformers in machine learning?",
                "Explain the concept of vector databases"
            ],
            "Technical Documentation Helper": [
                "How do I use the OpenAI API?",
                "What is Weaviate and how does it work?",
                "How to set up a Gaia node?",
                "What are the best practices for RAG implementation?"
            ],
            "News and Trends Analyzer": [
                "What are the recent AI news and developments?",
                "What companies are leading in AI innovation?",
                "What are the current trends in machine learning?",
                "What are the latest funding rounds in AI startups?"
            ],
            "Educational Content Generator": [
                "Explain artificial intelligence to beginners",
                "What are neural networks and how do they work?",
                "Compare different AI model architectures",
                "What is the difference between supervised and unsupervised learning?"
            ]
        }
    
    def fetch_comprehensive_data(self, quick_mode: bool = False) -> List[Dict[str, Any]]:
        """Fetch comprehensive real-world data from multiple sources."""
        print("🌐 Fetching Real-World Data for RAG Demo")
        print("=" * 60)
        
        all_documents = []
        
        # Adjust limits for quick mode
        wiki_limit = 5 if quick_mode else 10
        arxiv_limit = 2 if quick_mode else 5
        repo_limit = 3 if quick_mode else 8
        news_limit = 3 if quick_mode else 5
        
        try:
            # 1. Wikipedia AI Topics
            print(f"\n📖 Fetching {wiki_limit} Wikipedia articles...")
            wiki_source = WikipediaSource()
            wiki_topics = get_wikipedia_ai_topics()[:wiki_limit]
            wiki_docs = wiki_source.fetch_data(wiki_topics)
            all_documents.extend(wiki_docs)
            print(f"✅ Added {len(wiki_docs)} Wikipedia documents")
            
            # 2. ArXiv Research Papers  
            print(f"\n🔬 Fetching recent ArXiv papers...")
            arxiv_source = ArXivSource()
            research_topics = get_ai_research_topics()[:3]  # Top 3 topics
            arxiv_docs = arxiv_source.fetch_data(research_topics, max_results=arxiv_limit)
            all_documents.extend(arxiv_docs)
            print(f"✅ Added {len(arxiv_docs)} ArXiv documents")
            
            # 3. GitHub Documentation
            print(f"\n📂 Fetching GitHub documentation...")
            github_source = GitHubSource()
            repos = get_popular_ai_repos()[:repo_limit]
            github_docs = github_source.fetch_data(repos)
            all_documents.extend(github_docs)
            print(f"✅ Added {len(github_docs)} GitHub documents")
            
            # 4. Tech News
            print(f"\n📰 Fetching tech news...")
            rss_source = RSSFeedSource()
            news_feeds = get_tech_news_sources()[:2]  # Top 2 feeds
            news_docs = rss_source.fetch_data(news_feeds, max_articles=news_limit)
            all_documents.extend(news_docs)
            print(f"✅ Added {len(news_docs)} news articles")
            
        except Exception as e:
            print(f"⚠️ Some data sources failed: {e}")
            print("Continuing with available data...")
        
        print(f"\n🎉 Total documents collected: {len(all_documents)}")
        
        # Add metadata about the collection
        collection_metadata = {
            'title': 'Real-World Knowledge Base Collection Info',
            'content': f"""This knowledge base contains {len(all_documents)} documents collected from multiple real-world sources:

Wikipedia Articles: Comprehensive information about AI concepts and technologies
ArXiv Papers: Latest research findings and academic insights  
GitHub Documentation: Technical guides and implementation details
Tech News: Current industry developments and trends

Collection created: {datetime.now().isoformat()}
Total documents: {len(all_documents)}
Categories: AI research, documentation, news, encyclopedia content

This demonstrates a real-world RAG system with current, diverse content sources.""",
            'source': 'collection_metadata',
            'category': 'metadata',
            'metadata': {
                'total_documents': len(all_documents),
                'created_at': datetime.now().isoformat(),
                'quick_mode': quick_mode
            }
        }
        all_documents.append(collection_metadata)
        
        return all_documents
    
    def setup_knowledge_base(self, documents: List[Dict[str, Any]]):
        """Set up the knowledge base in Weaviate."""
        print(f"\n📚 Setting up knowledge base: {self.collection_name}")
        
        # Set up collection
        self.integration.setup_collection(self.collection_name)
        
        # Add documents in batches
        batch_size = 50
        total_batches = (len(documents) + batch_size - 1) // batch_size
        
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            
            print(f"📝 Adding batch {batch_num}/{total_batches} ({len(batch)} documents)")
            self.integration.add_documents(batch, self.collection_name)
            
            time.sleep(0.1)  # Small delay between batches
        
        print(f"✅ Knowledge base setup complete!")
    
    def demonstrate_use_case(self, use_case: str, queries: List[str]):
        """Demonstrate a specific RAG use case with real queries."""
        print(f"\n🎯 Use Case: {use_case}")
        print("=" * 60)
        
        for i, query in enumerate(queries, 1):
            print(f"\n📝 Query {i}: {query}")
            print("-" * 40)
            
            try:
                # Perform RAG query
                result = self.integration.rag_query(query, self.collection_name)
                
                # Display results
                print(f"🤖 Response:")
                print(f"{result['response']}")
                
                print(f"\n📚 Sources used:")
                for j, source in enumerate(result['sources'][:3], 1):  # Show top 3 sources
                    score_info = f" (score: {source['score']:.3f})" if source['score'] else ""
                    print(f"  {j}. {source['title']}{score_info}")
                    print(f"     Category: {source['category']} | Source: {source['source']}")
                
                print(f"\n🔧 Query processed with {len(result['sources'])} relevant documents")
                
            except Exception as e:
                print(f"❌ Error processing query: {e}")
            
            print()  # Add spacing between queries
    
    def run_comprehensive_demo(self, quick_mode: bool = True):
        """Run the complete real-world RAG demonstration."""
        print("🚀 Real-World RAG Demo with Internet Data")
        print("=" * 70)
        
        start_time = time.time()
        
        try:
            # Step 1: Fetch real data
            print(f"Mode: {'Quick Demo' if quick_mode else 'Comprehensive Demo'}")
            documents = self.fetch_comprehensive_data(quick_mode)
            
            if not documents:
                print("❌ No documents fetched. Please check your internet connection.")
                return
            
            # Step 2: Set up knowledge base
            self.setup_knowledge_base(documents)
            
            # Step 3: Perform health check
            print(f"\n🏥 Performing system health check...")
            health = self.integration.health_check()
            print(f"System status: {health['overall']}")
            
            if health['overall'] != 'healthy':
                print("⚠️ System health issues detected. Continuing anyway...")
            
            # Step 4: Demonstrate use cases
            print(f"\n🎭 Demonstrating RAG Use Cases")
            print("=" * 50)
            
            for use_case, queries in self.demo_queries.items():
                # Limit queries in quick mode
                demo_queries = queries[:2] if quick_mode else queries
                self.demonstrate_use_case(use_case, demo_queries)
                
                if not quick_mode:
                    time.sleep(1)  # Pause between use cases in comprehensive mode
            
            # Step 5: Show statistics
            self.show_demo_statistics(documents)
            
            elapsed_time = time.time() - start_time
            print(f"\n⏱️ Demo completed in {elapsed_time:.1f} seconds")
            
        except Exception as e:
            print(f"❌ Demo failed: {e}")
            if self.config.DEBUG:
                import traceback
                traceback.print_exc()
        
        finally:
            self.integration.close()
    
    def show_demo_statistics(self, documents: List[Dict[str, Any]]):
        """Show comprehensive statistics about the demo."""
        print(f"\n📊 Demo Statistics")
        print("=" * 40)
        
        # Document statistics
        categories = {}
        sources = {}
        total_content_length = 0
        
        for doc in documents:
            cat = doc.get('category', 'unknown')
            src = doc.get('source', 'unknown').split('_')[0]
            
            categories[cat] = categories.get(cat, 0) + 1
            sources[src] = sources.get(src, 0) + 1
            total_content_length += len(doc.get('content', ''))
        
        print(f"📈 Content Overview:")
        print(f"  Total documents: {len(documents)}")
        print(f"  Total content size: {total_content_length:,} characters")
        print(f"  Average document size: {total_content_length // len(documents):,} characters")
        
        print(f"\n📋 Categories:")
        for cat, count in sorted(categories.items()):
            print(f"  {cat}: {count} documents")
        
        print(f"\n🌐 Sources:")
        for src, count in sorted(sources.items()):
            print(f"  {src}: {count} documents")
        
        # Collection statistics
        try:
            collection = self.integration.weaviate_client.collections.get(self.collection_name)
            collection_stats = collection.aggregate.over_all(total_count=True)
            print(f"\n💾 Weaviate Collection:")
            print(f"  Collection name: {self.collection_name}")
            print(f"  Documents in collection: {collection_stats.total_count}")
            print(f"  Vectorizer: {self.config.VECTORIZER_MODULE}")
        except Exception as e:
            print(f"⚠️ Could not get collection statistics: {e}")
    
    def interactive_mode(self):
        """Run interactive mode for custom queries."""
        print(f"\n🎮 Interactive Mode")
        print("=" * 30)
        print("Ask questions about the knowledge base!")
        print("Type 'quit' to exit, 'help' for tips")
        
        while True:
            try:
                query = input("\n❓ Your question: ").strip()
                
                if query.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break
                
                if query.lower() == 'help':
                    self.show_help()
                    continue
                
                if not query:
                    continue
                
                print("🔍 Searching and generating response...")
                result = self.integration.rag_query(query, self.collection_name)
                
                print(f"\n🤖 Response:")
                print(f"{result['response']}")
                
                print(f"\n📚 Sources ({len(result['sources'])}):")
                for i, source in enumerate(result['sources'][:3], 1):
                    print(f"  {i}. {source['title']} ({source['category']})")
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
    
    def show_help(self):
        """Show help for interactive mode."""
        print(f"\n💡 Tips for better questions:")
        print(f"  • Ask about AI concepts: 'What are transformers?'")
        print(f"  • Request technical help: 'How do I use OpenAI API?'")
        print(f"  • Ask about recent news: 'What are the latest AI developments?'")
        print(f"  • Compare technologies: 'Compare different vector databases'")
        print(f"  • Educational queries: 'Explain machine learning to beginners'")


def create_sample_data_file():
    """Create a sample data file for testing without internet access."""
    sample_data = [
        {
            'title': 'Introduction to Large Language Models',
            'content': 'Large Language Models (LLMs) are a type of artificial intelligence model designed to understand and generate human-like text. These models are trained on vast amounts of text data and can perform various natural language processing tasks such as text completion, question answering, and language translation. Popular examples include GPT-3, GPT-4, and Claude.',
            'source': 'sample_ai_guide',
            'category': 'ai_concepts',
            'metadata': {'topic': 'LLM', 'difficulty': 'beginner'}
        },
        {
            'title': 'Vector Databases and Semantic Search',
            'content': 'Vector databases are specialized databases designed to store and query high-dimensional vectors. They enable semantic search by finding similar vectors based on mathematical distance metrics. This technology is crucial for RAG (Retrieval Augmented Generation) systems, where relevant information is retrieved from a knowledge base to provide context for language model responses.',
            'source': 'sample_vector_guide',
            'category': 'database',
            'metadata': {'topic': 'vector_db', 'difficulty': 'intermediate'}
        },
        {
            'title': 'Retrieval Augmented Generation (RAG)',
            'content': 'RAG is a technique that combines retrieval-based and generation-based approaches for natural language processing. It works by first retrieving relevant documents from a knowledge base, then using this information as context for a language model to generate more accurate and informed responses. This approach helps reduce hallucinations and provides up-to-date information.',
            'source': 'sample_rag_guide',
            'category': 'ai_techniques',
            'metadata': {'topic': 'RAG', 'difficulty': 'advanced'}
        }
    ]
    
    with open('sample_knowledge_data.json', 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    print("📄 Created sample_knowledge_data.json for offline testing")
    return sample_data


def main():
    """Main function to run the real-world RAG demo."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Real-World RAG Demo with Internet Data")
    parser.add_argument('--quick', action='store_true', help='Run quick demo with limited data')
    parser.add_argument('--interactive', action='store_true', help='Run interactive mode after demo')
    parser.add_argument('--offline', action='store_true', help='Use sample data instead of fetching from internet')
    parser.add_argument('--config-test', action='store_true', help='Test configuration only')
    
    args = parser.parse_args()
    
    # Test configuration first
    if args.config_test:
        from corrected_integration import test_configuration
        if test_configuration():
            print("✅ Configuration test passed!")
        else:
            print("❌ Configuration test failed!")
        return
    
    # Initialize demo
    demo = RealWorldRAGDemo()
    
    try:
        if args.offline:
            print("📄 Running offline demo with sample data...")
            documents = create_sample_data_file()
            demo.setup_knowledge_base(documents)
            
            # Test with sample queries
            sample_queries = [
                "What are large language models?",
                "How do vector databases work?",
                "Explain retrieval augmented generation"
            ]
            demo.demonstrate_use_case("Sample Demo", sample_queries)
            
        else:
            # Run main demo
            demo.run_comprehensive_demo(quick_mode=args.quick)
        
        # Interactive mode
        if args.interactive:
            demo.interactive_mode()
    
    except KeyboardInterrupt:
        print("\n👋 Demo interrupted by user")
    except Exception as e:
        print(f"❌ Demo failed: {e}")
    finally:
        demo.integration.close()


if __name__ == "__main__":
    main()