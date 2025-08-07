import pandas as pd
import re
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    
    #for white spaces
    text = re.sub(r'\s+', ' ', text.strip())
    
    #remove urls
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    
    #remove special chars
    text = re.sub(r'[^\w\s\.\,\!\?\-\']', '', text)
    
    return text.strip()

def is_relevant_content(text: str, brand_name: str = "leapscholar") -> bool:
    if not isinstance(text, str):
        return False
    
    text_lower = text.lower()
    brand_lower = brand_name.lower()
    if brand_lower in text_lower:
        return True
    
    #for variations
    variations = [
        "leap scholar", "leap-scholar", "leap_scholar",
        "leapscholar", "leap scholar", "leap scholar"
    ]
    
    for variation in variations:
        if variation in text_lower:
            return True
    
    return False

def filter_relevant_data(df: pd.DataFrame, brand_name: str = "LeapScholar") -> pd.DataFrame:
    logger.info(f"Original data size: {len(df)}")
    
    #filter for relevant content
    relevant_mask = df['text'].apply(lambda x: is_relevant_content(x, brand_name))
    filtered_df = df[relevant_mask].copy()
    
    logger.info(f"Relevant data size: {len(filtered_df)}")
    
    return filtered_df

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    logger.info(f"Before deduplication: {len(df)}")
    
    #remove duplicates
    df = df.drop_duplicates(subset=['text'], keep='first')
    df = df.drop_duplicates(subset=['platform', 'source'], keep='first')
    logger.info(f"After deduplication: {len(df)}")
    
    return df

def clean_and_prepare_data(input_file: str = 'raw_mentions.csv', 
                          output_file: str = 'cleaned_mentions.csv',
                          brand_name: str = "LeapScholar") -> bool:
    try:
        logger.info(f"Loading data from {input_file}")
        df = pd.read_csv(input_file)
        
        logger.info("Cleaning text data...")
        df['text'] = df['text'].apply(clean_text)
        
        logger.info("Filtering for relevant content...")
        df = filter_relevant_data(df, brand_name)
        
        #remove duplicates
        logger.info("Removing duplicates...")
        df = remove_duplicates(df)
        
        logger.info("Standardizing dates...")
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date'])
        
        df = df[df['text'].str.len() > 10]
        
        #sort by date
        df = df.sort_values('date', ascending=False)
        df = df.reset_index(drop=True)
        
        df.to_csv(output_file, index=False)
        logger.info(f"Cleaned data saved to {output_file}")
        logger.info(f"Final dataset size: {len(df)}")
        
        #print summary by platform
        platform_summary = df['platform'].value_counts()
        logger.info("Data summary by platform:")
        for platform, count in platform_summary.items():
            logger.info(f"  {platform}: {count}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error cleaning data: {e}")
        return False

def clean_dataset_files():
    import os
    
    dataset_dir = 'dataset'
    if not os.path.exists(dataset_dir):
        logger.error(f"Dataset directory '{dataset_dir}' not found!")
        return False
    
    files_to_clean = [
        'all_mentions.csv',
        'reddit_mentions.csv', 
        'news_mentions.csv',
        'twitter_mentions.csv'
    ]
    
    all_cleaned_data = []
    for filename in files_to_clean:
        filepath = os.path.join(dataset_dir, filename)
        if not os.path.exists(filepath):
            logger.warning(f"File {filepath} not found, skipping...")
            continue
            
        logger.info(f"Cleaning {filename}...")
        try:
            df = pd.read_csv(filepath)
            logger.info(f"  Original size: {len(df)}")
            
            df['text'] = df['text'].apply(clean_text)
            
            if filename != 'news_mentions.csv':
                df = filter_relevant_data(df, "LeapScholar")
                logger.info(f"  After filtering: {len(df)}")
            
            df = remove_duplicates(df)
            logger.info(f"  After deduplication: {len(df)}")
            
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            
            if filename == 'news_mentions.csv':
                df['date'] = df['date'].fillna(pd.Timestamp.now())
            else:
                df = df.dropna(subset=['date'])
            
            df = df[df['text'].str.len() > 10]
            all_cleaned_data.append(df)
            
            cleaned_filename = f"cleaned_{filename}"
            cleaned_filepath = os.path.join(dataset_dir, cleaned_filename)
            df.to_csv(cleaned_filepath, index=False)
            logger.info(f"  Saved cleaned file: {cleaned_filename}")
            
        except Exception as e:
            logger.error(f"Error cleaning {filename}: {e}")
            continue
    
    if all_cleaned_data:
        combined_df = pd.concat(all_cleaned_data, ignore_index=True)
        
        combined_df = remove_duplicates(combined_df)
        combined_df = combined_df.sort_values('date', ascending=False)
        combined_df = combined_df.reset_index(drop=True)
        
        combined_filepath = os.path.join(dataset_dir, 'cleaned_all_mentions.csv')
        combined_df.to_csv(combined_filepath, index=False)
        
        logger.info(f"Combined cleaned data saved to: {combined_filepath}")
        logger.info(f"Total cleaned mentions: {len(combined_df)}")
        
        #print summary by platform
        platform_summary = combined_df['platform'].value_counts()
        logger.info("Final data summary by platform:")
        for platform, count in platform_summary.items():
            logger.info(f"  {platform}: {count}")
        
        return True
    else:
        logger.error("No data was successfully cleaned!")
        return False

if __name__ == "__main__":
    success = clean_dataset_files()
    if success:
        print("Dataset cleaning completed successfully!")
    else:
        print("Dataset cleaning failed!") 