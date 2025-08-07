import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Link } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  ThumbUp as ThumbUpIcon, 
  ThumbDown as ThumbDownIcon,
  Twitter as TwitterIcon,
  Reddit as RedditIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

export type Platform = 'twitter' | 'reddit' | 'news' | string;

//sentiment chip
interface SentimentChipProps {
  sentiment?: 'positive' | 'negative' | 'neutral' | string;
  score?: number;
}

interface MentionItemProps {
  mention: MentionItemType | null;
  index: number;
}

//mention item type
export interface MentionItemType {
  platform: Platform;
  source?: string;
  text: string;
  compound: number;
  date?: string | Date;
  url?: string;
  total?: number;
  positive?: number;
  negative?: number;
  neutral?: number;
}

export interface TopMentionsData {
  positive?: MentionItemType[];
  negative?: MentionItemType[];
}

interface TopMentionsProps {
  data?: TopMentionsData;
}

//mention card
const MentionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const MentionContent = styled(CardContent)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: 16,
});

const MentionText = styled(Typography)<{ component?: React.ElementType }>({
  flex: 1,
  marginBottom: 12,
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const MentionFooter = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  paddingTop: 12,
  borderTop: '1px solid rgba(0, 0, 0, 0.12)',
});

//platform icon
const PlatformIcon = ({ platform }: { platform?: Platform }) => {
  const platformIcons = {
    twitter: <TwitterIcon color="primary" />,
    reddit: <RedditIcon color="error" />,
    news: <ArticleIcon color="info" />,
  };

  return platformIcons[platform?.toLowerCase() as keyof typeof platformIcons] || <ArticleIcon color="action" />;
};

//sentiment chip
const SentimentChip = ({ sentiment, score }: SentimentChipProps) => {
  const getChipProps = () => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return {
          icon: <ThumbUpIcon fontSize="small" />,
          label: 'Positive',
          color: 'success' as const,
        };
      case 'negative':
        return {
          icon: <ThumbDownIcon fontSize="small" />,
          label: 'Negative',
          color: 'error' as const,
        };
      default:
        return {
          label: 'Neutral',
          color: 'default' as const,
        };
    }
  };

  const chipProps = getChipProps();
  const displayScore = score !== undefined ? `${(score * 100).toFixed(0)}%` : '';

  return (
    <Box component="span" sx={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      ml: 1, 
      px: 1, 
      py: 0.5, 
      border: '1px solid', 
      borderColor: 'divider', 
      borderRadius: 1, 
      bgcolor: 'background.paper',
      color: chipProps.color === 'error' ? 'error.main' : chipProps.color === 'success' ? 'success.main' : 'text.primary'
    }}>
      {chipProps.icon}
      <Typography variant="caption" sx={{ ml: 0.5 }}>
        {displayScore ? `${chipProps.label} (${displayScore})` : chipProps.label}
      </Typography>
    </Box>
  );
};

const MentionItem: React.FC<MentionItemProps> = ({ mention, index }) => {
  if (!mention) {
    return (

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }} key={index}>
        <MentionCard>
          <MentionContent>
            <Box height={24} bgcolor="#f5f5f5" width="80%" mb={2} />
            <Box height={16} bgcolor="#f5f5f5" width="100%" mb={1} />
            <Box height={16} bgcolor="#f5f5f5" width="90%" mb={1} />
            <Box height={16} bgcolor="#f5f5f5" width="70%" mb={2} />
            <MentionFooter>
              <Box display="flex" alignItems="center">
                <Box width={24} height={24} borderRadius="50%" bgcolor="#f5f5f5" mr={1} />
                <Box width={60} height={16} bgcolor="#f5f5f5" />
              </Box>
              <Box width={80} height={24} bgcolor="#f5f5f5" borderRadius={16} />
            </MentionFooter>
          </MentionContent>
        </MentionCard>
      </Box>
    );
  }

  const { platform, source, text, url, date, compound } = mention;
  const sentiment = compound > 0.33 ? 'positive' : compound < -0.33 ? 'negative' : 'neutral';
  
  console.log('Mention data:', { platform, source, text, url, date, compound });
  
  //URL based on platform
  const getMentionUrl = () => {
    console.log('getMentionUrl called with:', { url, platform, source });
    if (url) {
      if (platform?.toLowerCase() === 'twitter' && !url.startsWith('http')) {
        const statusMatch = url.match(/\/status\/(\d+)/);
        if (statusMatch) {
          return `https://twitter.com/i/web/status/${statusMatch[1]}`;
        }
        if (/^\d+$/.test(url)) {
          return `https://twitter.com/i/web/status/${url}`;
        }
        return `https://twitter.com${url.startsWith('/') ? '' : '/'}${url}`;
      }
      return url;
    }
    
    if (platform?.toLowerCase() === 'twitter' && source) {
      if (source.startsWith('@')) {
        return `https://twitter.com/${source.substring(1)}`;
      }
      if (/^\d+$/.test(source)) {
        return `https://twitter.com/i/web/status/${source}`;
      }
      if (source.startsWith('/')) {
        return `https://twitter.com${source}`;
      }
    }
    
    console.log('No valid URL could be constructed');
    return null;
  };
  
  const mentionUrl = getMentionUrl();
  
  return (
    <Box key={index}>
      <MentionCard>
        <MentionContent>
          <Box display="flex" alignItems="center" mb={1}>
            <PlatformIcon platform={platform} />
            <Typography variant="caption" color="textSecondary" ml={1}>
              {source || platform}
            </Typography>
            {date && (
              <Typography variant="caption" color="textSecondary" ml="auto">
                {formatDistanceToNow(new Date(date), { addSuffix: true })}
              </Typography>
            )}
          </Box>
          
          <MentionText variant="body2" component="div">
            {mentionUrl ? (
              <Link href={mentionUrl} target="_blank" rel="noopener noreferrer" color="inherit" underline="hover">
                {text}
              </Link>
            ) : (
              text
            )}
          </MentionText>
          
          <MentionFooter>
            <Box display="flex" alignItems="center">
              <SentimentChip sentiment={sentiment} score={Math.abs(compound)} />
            </Box>
            <Box display="flex" alignItems="center">
              {mention.positive !== undefined && (
                <Typography variant="caption" color="success.main" mr={1}>
                  {mention.positive}👍
                </Typography>
              )}
              {mention.negative !== undefined && (
                <Typography variant="caption" color="error.main">
                  {mention.negative}👎
                </Typography>
              )}
            </Box>
          </MentionFooter>
        </MentionContent>
      </MentionCard>
    </Box>
  );
};

const TopMentions: React.FC<TopMentionsProps> = ({ data = {} }) => {
  const { positive = [], negative = [] } = data;
  const allMentions = [...(positive || []), ...(negative || [])];
  
  const sortedMentions = [...allMentions].sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return Math.abs(b.compound) - Math.abs(a.compound);
  });
  
  //top 6 mentions
  const topMentions = sortedMentions.slice(0, 6);
  
  while (topMentions.length < 6) {
    topMentions.push(null as any);
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Top Mentions
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Most recent and impactful mentions across all platforms
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {topMentions.map((mention, index) => (
          <MentionItem key={index} mention={mention} index={index} />
        ))}
      </Grid>
    </Box>
  );
};

export default TopMentions;
