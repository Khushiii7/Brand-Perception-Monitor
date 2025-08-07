import pandas as pd
import logging
from sentiment_analysis import SentimentAnalyzer

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def restore_and_fix_data():
    try:
        cleaned_file = 'dataset/cleaned_all_mentions.csv'
        df = pd.read_csv(cleaned_file)
        logger.info(f"Loaded {len(df)} mentions from cleaned data")
        logger.info(f"Original columns: {list(df.columns)}")
        
        columns_to_keep = ['platform', 'source', 'text', 'date', 'url']
        df = df[columns_to_keep].copy()
        
        #sentiment analyzer
        analyzer = SentimentAnalyzer()
        
        logger.info("Processing sentiment analysis...")
        sentiment_results = []
        
        for index, row in df.iterrows():
            text = row['text']
            sentiment, compound, scores = analyzer.get_sentiment(text)
            sentiment_results.append({
                'sentiment': sentiment,
                'compound': compound
            })
        
        #results to dataframe
        sentiment_df = pd.DataFrame(sentiment_results)
        result_df = pd.concat([df, sentiment_df], axis=1)
        
        result_df['analyzed_at'] = pd.Timestamp.now()
        
        #cleaning
        result_df = result_df.dropna(subset=['sentiment'])
        result_df = result_df[result_df['sentiment'] != '']
        
        result_df['compound'] = pd.to_numeric(result_df['compound'], errors='coerce')
        result_df = result_df.dropna(subset=['compound'])
        
        result_df['date'] = pd.to_datetime(result_df['date'], errors='coerce')
        result_df = result_df.sort_values('date', ascending=False)
        
        result_df = result_df.reset_index(drop=True)
        
        logger.info(f"Final data shape: {result_df.shape}")
        logger.info(f"Final columns: {list(result_df.columns)}")
        
        #sentiment summary
        sentiment_summary = result_df['sentiment'].value_counts()
        logger.info("Sentiment Summary:")
        for sentiment, count in sentiment_summary.items():
            logger.info(f"  {sentiment.capitalize()}: {count}")
        
        avg_compound = result_df['compound'].mean()
        logger.info(f"Average compound score: {avg_compound:.4f}")
        
        result_df.to_csv('processed_mentions.csv', index=False)
        logger.info("Fixed data saved to processed_mentions.csv")
        
        return True
        
    except Exception as e:
        logger.error(f"Error restoring and fixing data: {e}")
        return False

if __name__ == "__main__":
    success = restore_and_fix_data()
    if success:
        print("Data restored and fixed successfully!")
    else:
        print("Failed to restore and fix data!") 