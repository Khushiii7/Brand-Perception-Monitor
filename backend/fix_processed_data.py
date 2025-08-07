import pandas as pd
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def fix_processed_data():
    try:
        df = pd.read_csv('processed_mentions.csv')
        logger.info(f"Original data shape: {df.shape}")
        logger.info(f"Original columns: {list(df.columns)}")
        
        #remove duplicate columns
        if 'sentiment' in df.columns:
            #sentiment columns
            sentiment_cols = [col for col in df.columns if col == 'sentiment']
            if len(sentiment_cols) > 1:
                df = df.drop(columns=sentiment_cols[:-1])
                logger.info(f"Removed duplicate sentiment columns, kept: {sentiment_cols[-1]}")
        
        if 'compound' in df.columns:
            compound_cols = [col for col in df.columns if col == 'compound']
            if len(compound_cols) > 1:
                df = df.drop(columns=compound_cols[:-1])
                logger.info(f"Removed duplicate compound columns, kept: {compound_cols[-1]}")
        
        #empty rows
        df = df.dropna(subset=['sentiment'])
        df = df[df['sentiment'] != '']
        
        df['compound'] = pd.to_numeric(df['compound'], errors='coerce')
        df = df.dropna(subset=['compound'])
        
        #date sortng
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.sort_values('date', ascending=False)
        
        df = df.reset_index(drop=True)
        
        logger.info(f"Fixed data shape: {df.shape}")
        logger.info(f"Fixed columns: {list(df.columns)}")
        
        sentiment_summary = df['sentiment'].value_counts()
        logger.info("Sentiment Summary:")
        for sentiment, count in sentiment_summary.items():
            logger.info(f"  {sentiment.capitalize()}: {count}")
        df.to_csv('processed_mentions.csv', index=False)
        logger.info("Fixed data saved to processed_mentions.csv")
        
        return True
        
    except Exception as e:
        logger.error(f"Error fixing processed data: {e}")
        return False

if __name__ == "__main__":
    success = fix_processed_data()
    if success:
        print("Data fixed successfully!")
    else:
        print("Failed to fix data!") 