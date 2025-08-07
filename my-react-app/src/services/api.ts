//api
export const API_BASE_URL = 'http://localhost:8000'; // Default FastAPI port

//types
export interface SentimentSummary {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  average_compound: number;
}

export interface PlatformStat {
  name: string;
  value: number;
  total: number;
  color?: string;
}

export interface TimelineDataPoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface MentionItem {
  id?: string;
  platform: string;
  source?: string;
  text: string;
  compound: number;
  date?: string;
  positive?: number;
  negative?: number;
  neutral?: number;
  url?: string;
}

export interface TopMentionsResponse {
  positive: MentionItem[];
  negative: MentionItem[];
}

//API functions
export const fetchSentimentSummary = async (days: number = 30): Promise<SentimentSummary> => {
  const response = await fetch(`${API_BASE_URL}/summary?days=${days}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sentiment summary');
  }
  const data = await response.json();
  
  return {
    total: data.total || 0,
    positive: data.positive || 0,
    neutral: data.neutral || 0,
    negative: data.negative || 0,
    average_compound: data.average_compound || 0
  };
};

export const fetchPlatformStats = async (): Promise<PlatformStat[]> => {
  const response = await fetch(`${API_BASE_URL}/platforms`);
  if (!response.ok) {
    throw new Error('Failed to fetch platform statistics');
  }
  const data = await response.json();
  
  console.log('Raw platform data from backend:', JSON.stringify(data, null, 2));
  
  if (!data || data.length === 0) {
    console.warn('No platform data received from backend');
    return [];
  }
  
  const platformColors: Record<string, string> = {
    'Twitter': '#1DA1F2',
    'Reddit': '#FF5700',
    'News': '#FFC107',
    'Other': '#4CAF50',
    'twitter': '#1DA1F2',  
    'reddit': '#FF5700',
    'news': '#FFC107',
    'other': '#4CAF50',
  };
  
  const result = data.map((item: any) => {
    const total = item.total || 
      (item.positive || 0) + (item.neutral || 0) + (item.negative || 0);
    
    const platformName = item.platform || item.name || 'Unknown';
    const displayName = platformName.charAt(0).toUpperCase() + platformName.slice(1).toLowerCase();
    
    return {
      name: displayName,
      value: total,
      total: total, 
      color: platformColors[platformName] || platformColors[displayName] || '#9E9E9E',
    };
  });
  
  console.log('Processed platform data:', JSON.stringify(result, null, 2));
  return result;
};

export const fetchTimelineData = async (days: number = 30): Promise<TimelineDataPoint[]> => {
  const response = await fetch(`${API_BASE_URL}/timeline?days=${days}`);
  if (!response.ok) {
    throw new Error('Failed to fetch timeline data');
  }
  return response.json();
};

export const fetchTopMentions = async (limit: number = 6, days: number = 30): Promise<TopMentionsResponse> => {
  const response = await fetch(`${API_BASE_URL}/top?limit=${limit}&days=${days}`);
  if (!response.ok) {
    throw new Error('Failed to fetch top mentions');
  }
  const data = await response.json();
  return {
    positive: data.top_positive || [],
    negative: data.top_negative || []
  };
};

export const fetchAllMentions = async (days: number = 30): Promise<MentionItem[]> => {
  const response = await fetch(`${API_BASE_URL}/mentions?days=${days}`);
  if (!response.ok) {
    throw new Error('Failed to fetch mentions');
  }
  return response.json();
};
