import os
import re
import pandas as pd
import nltk
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import logging
from typing import Tuple, Dict

#NLTK data
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english') + ['rt', 'http', 'https', 'amp'])
        self.brand_name = os.getenv('BRAND_NAME', 'leapscholar').lower()
        self.POS_THRESHOLD = 0.2
        self.NEG_THRESHOLD = -0.2
    
    def clean_text(self, text: str) -> str:
        if not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r'https?://\S+|www\.\S+', '', text)  # Remove URLs
        text = re.sub(r'@\w+|#\w+', '', text)  # Remove mentions/hashtags
        text = re.sub(r'[^\w\s]', '', text)  # Remove special chars
        tokens = word_tokenize(text)
        tokens = [self.lemmatizer.lemmatize(t) for t in tokens 
                 if t not in self.stop_words and len(t) > 2]
        return ' '.join(tokens)
    
    #sentiment
    def get_sentiment(self, text: str) -> Tuple[str, float, Dict]:
        if not text or not isinstance(text, str) or len(text.strip()) < 3:
            return 'neutral', 0.0, {'neg': 0.0, 'neu': 1.0, 'pos': 0.0, 'compound': 0.0}
        
        cleaned = self.clean_text(text)
        if not cleaned.strip():
            return 'neutral', 0.0, {'neg': 0.0, 'neu': 1.0, 'pos': 0.0, 'compound': 0.0}
        
        scores = self.analyzer.polarity_scores(cleaned)
        compound = scores['compound']
        
        if compound >= self.POS_THRESHOLD:
            sentiment = 'positive'
        elif compound <= self.NEG_THRESHOLD:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return sentiment, compound, scores

#analyze
def analyze_and_save():
    analyzer = SentimentAnalyzer()
    cleaned_file = 'dataset/cleaned_all_mentions.csv'
    output_file = os.getenv('PROCESSED_DATA_FILE', 'processed_mentions.csv')
    
    if not os.path.exists(cleaned_file):
        logger.error(f"Cleaned data file not found: {cleaned_file}")
        return False
    
    logger.info(f"Analyzing cleaned data from {cleaned_file}")
    df = pd.read_csv(cleaned_file)
    
    logger.info(f"Processing {len(df)} mentions...")
    
    #sentiment analysis
    sentiment_results = df['text'].apply(
        lambda x: pd.Series(analyzer.get_sentiment(x)[:2], 
                          index=['sentiment', 'compound'])
    )
    
    result_df = pd.concat([df, sentiment_results], axis=1)
    result_df['analyzed_at'] = pd.Timestamp.now()
    
    #save results
    result_df.to_csv(output_file, index=False)
    logger.info(f"Saved processed data to {output_file}")
    
    #summary
    try:
        sentiment_summary = result_df['sentiment'].value_counts()
        logger.info("Sentiment Analysis Summary:")
        for sentiment, count in sentiment_summary.items():
            logger.info(f"  {sentiment.capitalize()}: {count}")
        
        avg_compound = result_df['compound'].mean()
        logger.info(f"Average compound score: {avg_compound:.4f}")
    except Exception as e:
        logger.warning(f"Could not generate summary: {e}")
        logger.info("Sentiment analysis completed successfully!")
    
    return True

if __name__ == '__main__':
    analyze_and_save()