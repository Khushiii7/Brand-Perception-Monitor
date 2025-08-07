import os
import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uvicorn
import json
from pathlib import Path
#fastapi
app = FastAPI(
    title="LeapScholar Brand Perception Monitor API",
    description="API for monitoring and analyzing brand mentions across social media",
    version="1.0.0"
)

#cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.getenv('PROCESSED_DATA_FILE', 'processed_mentions.csv')
DEFAULT_DAYS = 30

#data load fun
def load_data() -> pd.DataFrame:
    print(f"Looking for data file at: {os.path.abspath(DATA_FILE)}")
    if not os.path.exists(DATA_FILE):
        print("Data file not found!")
        return pd.DataFrame()

    
    print("File found. Loading data...")
    
    try:
        print("Trying to load as JSON...")
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print("Successfully loaded as JSON")
        df = pd.DataFrame(data)
    except json.JSONDecodeError as je:
        print(f"Not a JSON file: {str(je)}")
        try:
            print("Trying to load as CSV...")
            df = pd.read_csv(DATA_FILE)
            print("Successfully loaded as CSV")
        except Exception as e:
            print(f"Failed to load data: {str(e)}")
            return pd.DataFrame()
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        return pd.DataFrame()
    
    print(f"Successfully loaded {len(df)} rows")
    
    if 'date' in df.columns:
        print("Converting date column to datetime...")
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
    else:
        print("No 'date' column found in the data")
    
    return df

def get_date_range(days: int = DEFAULT_DAYS):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date

#endpoints of apis
@app.get("/")
async def root():
    return {
        "name": "LeapScholar Brand Perception Monitor",
        "version": "1.0.0",
        "endpoints": [
            {"path": "/mentions", "method": "GET", "description": "Get all mentions"},
            {"path": "/summary", "method": "GET", "description": "Get sentiment summary"},
            {"path": "/top", "method": "GET", "description": "Get top positive/negative mentions"},
            {"path": "/timeline", "method": "GET", "description": "Get mentions timeline"},
            {"path": "/platforms", "method": "GET", "description": "Get mentions by platform"}
        ]
    }

#mentions api
@app.get("/mentions")
async def get_mentions(
    days: int = Query(DEFAULT_DAYS, description="Number of days to look back"),
    platform: Optional[str] = Query(None, description="Filter by platform (Twitter, Reddit, News)"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment (positive, negative, neutral)")
):
    try:
        df = load_data()
        if df.empty:
            return []
        
        start_date, _ = get_date_range(days)
        if 'date' in df.columns:
            df = df[df['date'] >= start_date]
        
        if platform:
            df = df[df['platform'].str.lower() == platform.lower()]
        
        if sentiment:
            df = df[df['sentiment'].str.lower() == sentiment.lower()]
        
        return df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#summary api
@app.get("/summary")
async def get_summary(days: int = Query(DEFAULT_DAYS, description="Number of days to look back")):
    try:
        df = load_data()
        
        if df.empty:
            return {
                "total": 0,
                "positive": 0,
                "neutral": 0,
                "negative": 0,
                "average_compound": 0
            }
        #debug
        print("Columns:", df.columns.tolist())
        print("First few rows:")
        print(df.head().to_dict('records'))
        
        # date filtering
        start_date, _ = get_date_range(days)
        print(f"Filtering data from {start_date}")
        
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df[df['date'] >= start_date]
        
        print(f"After date filtering: {len(df)} rows")
        
        #check sentiment column
        if 'sentiment' not in df.columns:
            print("No 'sentiment' column found in data")
            return {
                "total": 0,
                "positive": 0,
                "neutral": 0,
                "negative": 0,
                "average_compound": 0
            }
        
        print("Unique sentiment values:", df['sentiment'].unique())
        
        sentiment_counts = df['sentiment'].value_counts()
        print("Sentiment counts:", sentiment_counts.to_dict())
        
        summary = {
            'positive': int(sentiment_counts.get('positive', 0)),
            'neutral': int(sentiment_counts.get('neutral', 0)),
            'negative': int(sentiment_counts.get('negative', 0))
        }
        
        avg_compound = float(df['compound'].mean()) if 'compound' in df.columns else 0.0
        
        result = {
            "total": int(len(df)),
            "positive": summary['positive'],
            "neutral": summary['neutral'],
            "negative": summary['negative'],
            "average_compound": round(avg_compound, 4)
        }
        
        print("Returning result:", result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#top mentions api
@app.get("/top")
async def get_top_mentions(
    limit: int = Query(3, description="Number of top mentions to return"),
    days: int = Query(DEFAULT_DAYS, description="Number of days to look back")
):
    try:
        df = load_data()
        if df.empty:
            return {"top_positive": [], "top_negative": []}
        
        start_date, _ = get_date_range(days)
        if 'date' in df.columns:
            df = df[df['date'] >= start_date]
        
        # Clean URLs
        def format_url(row):
            if pd.isna(row.get('url')) or not str(row['url']).strip():
                return None
                
            url = str(row['url']).strip()
            platform = str(row.get('platform', '')).lower()
            
            #Twitter URLs
            if 'twitter' in platform or 'twitter' in url.lower():
                #status ID
                if url.isdigit():
                    return f"https://twitter.com/i/web/status/{url}"
                #partial URL
                if '/status/' in url:
                    status_id = url.split('/status/')[-1].split('/')[0].split('?')[0]
                    if status_id.isdigit():
                        return f"https://twitter.com/i/web/status/{status_id}"
                #username
                if url.startswith('@'):
                    return f"https://twitter.com/{url[1:]}"
                #path
                if url.startswith('/'):
                    return f"https://twitter.com{url}"
            
            #other URLs
            if ':' not in url.split('/')[0]:
                return f"https://{url}"
                
            return url
        
        #URL formatting
        df['formatted_url'] = df.apply(format_url, axis=1)
        
        #top positive and negative mentions
        pos = (df[df['sentiment'] == 'positive']
               .sort_values(by='compound', ascending=False)
               .head(limit))
        neg = (df[df['sentiment'] == 'negative']
               .sort_values(by='compound')
               .head(limit))
        
        #convert to dict
        def prepare_mentions(df):
            result = []
            for _, row in df.iterrows():
                mention = {
                    'platform': row.get('platform'),
                    'source': row.get('source'),
                    'text': row.get('text'),
                    'compound': row.get('compound'),
                    'date': row.get('date'),
                    'url': row.get('formatted_url') or row.get('url')
                }
                for k, v in mention.items():
                    if hasattr(v, 'item'):  #numpy types
                        mention[k] = v.item()
                result.append(mention)
            return result
        
        return {
            'top_positive': prepare_mentions(pos),
            'top_negative': prepare_mentions(neg)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/timeline")
async def get_timeline(
    days: int = Query(30, description="Number of days to look back"),
    group_by: str = Query("date", description="Group by 'date' or 'week'")
):
    try:
        df = load_data()
        if df.empty or 'date' not in df.columns:
            return []
        
        #date filtering
        start_date, _ = get_date_range(days)
        df = df[df['date'] >= start_date]
        
        #group by date
        df['date'] = pd.to_datetime(df['date']).dt.date
        
        if group_by.lower() == 'week':
            df['period'] = pd.to_datetime(df['date']) - pd.to_timedelta(
                pd.to_datetime(df['date']).dt.dayofweek, unit='d')
            group_col = 'period'
        else:
            group_col = 'date'
        
        #group and count
        timeline = df.groupby([group_col, 'sentiment']).size().unstack(fill_value=0)
        
        timeline = timeline.reset_index()
        timeline[group_col] = timeline[group_col].astype(str)
        
        return timeline.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
#platform api
@app.get("/platforms")
async def get_platform_stats(
    days: int = Query(DEFAULT_DAYS, description="Number of days to look back")
):
    try:
        print("Loading data for platform statistics...")
        df = load_data()
        
        if df.empty:
            print("No data loaded from the data source")
            return []
            
        print(f"Columns in data: {df.columns.tolist()}")
        
        if 'platform' not in df.columns:
            print("No 'platform' column found in the data")
            return []
        
        start_date, _ = get_date_range(days)
        if 'date' in df.columns:
            df = df[df['date'] >= start_date]
        
        print(f"Total records after date filtering: {len(df)}")
        print(f"Platforms found: {df['platform'].unique().tolist()}")
        
        platform_counts = df['platform'].value_counts().reset_index()
        platform_counts.columns = ['platform', 'total']
        
        sentiment_counts = df.groupby(['platform', 'sentiment']).size().unstack(fill_value=0)
        
        result = platform_counts.merge(sentiment_counts, left_on='platform', right_index=True, how='left')
        
        for sentiment in ['positive', 'negative', 'neutral']:
            if sentiment not in result.columns:
                result[sentiment] = 0
        
        formatted_result = []
        for _, row in result.iterrows():
            formatted_result.append({
                'platform': row['platform'],
                'total': int(row['total']),
                'positive': int(row.get('positive', 0)),
                'negative': int(row.get('negative', 0)),
                'neutral': int(row.get('neutral', 0))
            })
        
        print(f"Returning platform stats: {formatted_result}")
        return formatted_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
