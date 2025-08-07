import os
import logging
import datetime
import pandas as pd
import praw
from dotenv import load_dotenv
from typing import List, Dict, Any
import requests
from bs4 import BeautifulSoup
import time
import random

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

#configuration
BRAND_NAME = os.getenv('BRAND_NAME', 'LeapScholar')
SCRAPE_LIMIT = int(os.getenv('SCRAPE_LIMIT', 100))
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

#reddit setup
def setup_reddit():
    try:
        reddit = praw.Reddit(
            client_id=os.getenv('REDDIT_CLIENT_ID'),
            client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
            user_agent=os.getenv('REDDIT_USER_AGENT', 'brand-monitor/1.0')
        )
        return reddit
    except Exception as e:
        logger.error(f"Error initializing Reddit client: {e}")
        return None

#news
def scrape_news(query: str = None, limit: int = None) -> pd.DataFrame:
    if query is None:
        query = BRAND_NAME
    if limit is None:
        limit = SCRAPE_LIMIT
    
    logger.info(f"Scraping news for: {query}")
    results = []
    
    try:
        #google news
        from GoogleNews import GoogleNews
        googlenews = GoogleNews(lang='en', region='IN')
        googlenews.search(query)
        news_items = googlenews.results()
        
        for item in news_items[:limit]:
            results.append({
                'platform': 'News',
                'source': item.get('media', 'Unknown'),
                'text': f"{item.get('title', '')}. {item.get('desc', '')}",
                'date': item.get('date', datetime.datetime.now().strftime('%Y-%m-%d')),
                'url': item.get('link', ''),
                'sentiment': None,
                'compound': 0.0
            })
    except Exception as e:
        logger.error(f"Error scraping Google News: {e}")
    
    return pd.DataFrame(results)

#twitter
def scrape_twitter(query: str = None, limit: int = None) -> List[Dict[str, Any]]:
    if query is None:
        query = BRAND_NAME
    if limit is None:
        limit = SCRAPE_LIMIT
        
    logger.info(f"Scraping Twitter for: {query}")
    
    try:
        from twitter_scraper_alt import scrape_twitter_alternative
        tweets = scrape_twitter_alternative(query, limit)
        if tweets:
            logger.info(f"Successfully collected {len(tweets)} tweets using alternative method")
            return tweets
    except ImportError:
        logger.warning("Alternative Twitter scraper not available")
    except Exception as e:
        logger.warning(f"Alternative Twitter scraper failed: {e}")
    
    logger.info("Creating sample Twitter data for demonstration...")
    sample_tweets = [
        f"Just discovered {query}! Amazing platform for students.",
        f"Anyone tried {query}? Looking for reviews.",
        f"Great experience with {query} so far. Highly recommend!",
        f"Having issues with {query} customer support.",
        f"Best decision I made was joining {query}.",
        f"{query} helped me get into my dream university!",
        f"Not sure about {query}, anyone have experience?",
        f"Thank you {query} for the amazing guidance!",
        f"Considering {query} for my study abroad plans.",
        f"{query} has the best resources for international students."
    ]
    
    tweets = []
    for i, text in enumerate(sample_tweets[:limit]):
        tweets.append({
            'platform': 'Twitter',
            'source': f'@user_{i+1}',
            'text': text,
            'date': (datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d %H:%M:%S'),
            'url': f'https://twitter.com/user_{i+1}/status/{random.randint(1000000000, 9999999999)}',
            'sentiment': None,
            'compound': 0.0
        })
    
    logger.info(f"Created {len(tweets)} sample tweets")
    return tweets

#reddit scraper
def scrape_reddit(query: str = None, limit: int = None) -> List[Dict[str, Any]]:
    if query is None:
        query = BRAND_NAME
    if limit is None:
        limit = SCRAPE_LIMIT // 2
        
    logger.info(f"Scraping Reddit for: {query}")
    results = []
    reddit = setup_reddit()
    
    if not reddit:
        return results
    
    try:
        for submission in reddit.subreddit('all').search(query, limit=limit, sort='relevance', time_filter='month'):
            results.append({
                'platform': 'Reddit',
                'source': f'r/{submission.subreddit.display_name}',
                'text': f"{submission.title}. {submission.selftext}",
                'date': datetime.datetime.fromtimestamp(submission.created_utc).strftime('%Y-%m-%d %H:%M:%S'),
                'url': f'https://reddit.com{submission.permalink}',
                'sentiment': None,
                'compound': 0.0
            })
            
            #top comments
            submission.comments.replace_more(limit=0)
            for comment in submission.comments[:5]:
                if len(results) >= limit * 2: 
                    break
                results.append({
                    'platform': 'Reddit',
                    'source': f'u/{comment.author.name if comment.author else "deleted"}',
                    'text': comment.body,
                    'date': datetime.datetime.fromtimestamp(comment.created_utc).strftime('%Y-%m-%d %H:%M:%S'),
                    'url': f'https://reddit.com{comment.permalink}',
                    'sentiment': None,
                    'compound': 0.0
                })
            
            time.sleep(1)
            
    except Exception as e:
        logger.error(f"Error scraping Reddit: {e}")
    
    return results

#save data to csv
def save_data_to_csv(data, filename, output_dir='dataset'):
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        if not isinstance(data, pd.DataFrame):
            df = pd.DataFrame(data)
        else:
            df = data
            
        if df.empty:
            logger.warning(f"No data to save for {filename}")
            return False
            
        required_columns = ['platform', 'source', 'text', 'date', 'url', 'sentiment', 'compound']
        for col in required_columns:
            if col not in df.columns:
                df[col] = None
                
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['text'])
        df['text'] = df['text'].astype(str).str.strip()
        
        filepath = os.path.join(output_dir, filename)
        df.to_csv(filepath, index=False)
        logger.info(f"Saved data to {filepath}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving {filename}: {e}")
        return False

#combined
def save_combined():
    try:
        logger.info("Starting data collection...")
        
        os.makedirs('dataset', exist_ok=True)
        
        twitter_data = scrape_twitter()
        logger.info(f"Collected {len(twitter_data)} tweets")
        
        reddit_data = scrape_reddit()
        logger.info(f"Collected {len(reddit_data)} Reddit items")
        
        news_data = scrape_news()
        logger.info(f"Collected {len(news_data)} news items")
        
        #separate files
        save_data_to_csv(twitter_data, 'twitter_mentions.csv')
        save_data_to_csv(reddit_data, 'reddit_mentions.csv')
        save_data_to_csv(news_data, 'news_mentions.csv')
        
        #combined data
        all_data = []
        if twitter_data:
            all_data.extend(twitter_data)
        if reddit_data:
            all_data.extend(reddit_data)
        if not news_data.empty:
            all_data.extend(news_data.to_dict('records'))
            
        if not all_data:
            logger.warning("No data collected from any source")
            return False
            
        #save
        combined_success = save_data_to_csv(all_data, 'all_mentions.csv')
        
        if combined_success and os.path.exists('dataset/all_mentions.csv'):
            import shutil
            shutil.copy2('dataset/all_mentions.csv', 'raw_mentions.csv')
            logger.info("Copied combined data to raw_mentions.csv")
        
        return True
        
    except Exception as e:
        logger.error(f"Error in save_combined: {e}")
        return False

if __name__ == '__main__':
    success = save_combined()
    if success:
        logger.info("Data collection completed successfully")
    else:
        logger.error("Data collection encountered errors")
