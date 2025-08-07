import { Box, Typography, LinearProgress, useTheme, Card, CardContent, keyframes } from '@mui/material';
import type { LinearProgressProps } from '@mui/material';
import { 
  SentimentSatisfiedAlt as PositiveIcon, 
  SentimentNeutral as NeutralIcon, 
  SentimentDissatisfied as NegativeIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

//animation
const progressAnimation = keyframes`
  0% { width: 0; }
  100% { width: 100%; }
`;

export interface SentimentScore {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  average_compound: number;
}

export interface SentimentSummaryProps {
  data?: SentimentScore;
}

interface SentimentMeterProps extends Omit<LinearProgressProps, 'color'> {
  value: number;
  color: string;
}

//stat card
const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

//stat card content
const StatCardContent = styled(CardContent)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  height: '100%',
}));

//stat value
const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  lineHeight: 1.2,
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(45deg, #90caf9, #64b5f6)' 
    : 'linear-gradient(45deg, #1976d2, #2196f3)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  margin: '8px 0',
}));

//stat label
const StatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textAlign: 'center',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontSize: '0.8rem',
}));

//stat change
const StatChange = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'positive',
})<{ positive?: boolean }>(({ theme, positive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  color: positive ? theme.palette.success.main : theme.palette.error.main,
  fontWeight: 500,
  fontSize: '0.875rem',
  marginTop: 4,
}));

//sentiment icon
const SentimentIcon = styled(Box)(({ theme }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(1),
  '& svg': {
    fontSize: '2.5rem',
  },
}));

//sentiment meter
const SentimentMeter: React.FC<SentimentMeterProps> = ({ value, color, ...props }) => {
  const theme = useTheme();
  const normalizedValue = Math.min(Math.max((value + 1) * 50, 0), 100); // Scale from -1..1 to 0..100
  
  return (
    <Box width="100%" mt={2}>
      <Box position="relative" width="100%" height={8} borderRadius={4} bgcolor={theme.palette.grey[200]} overflow="hidden">
        <Box
          position="absolute"
          top={0}
          left={0}
          height="100%"
          width={`${normalizedValue}%`}
          bgcolor={color}
          borderRadius={4}
          sx={{
            transition: 'width 1s ease-in-out',
            animation: `${progressAnimation} 1s ease-out forwards`,
          }}
        />
      </Box>
      <Box display="flex" justifyContent="space-between" mt={1}>
        <Typography variant="caption" color="textSecondary">
          -1.0
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {value.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          +1.0
        </Typography>
      </Box>
    </Box>
  );
};

const SentimentSummary: React.FC<SentimentSummaryProps> = ({ data }) => {
  const theme = useTheme();
  
  if (!data) {
    return (
      <Box p={2} textAlign="center">
        <Typography color="textSecondary">No sentiment data available</Typography>
      </Box>
    );
  }
  
  const { 
    total = 0, 
    positive = 0, 
    neutral = 0, 
    negative = 0, 
    average_compound = 0 
  } = data;
  
  // Calculate percentages with one decimal precision
  const calculatePercentage = (value: number, total: number): number => {
    return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
  };

  // Calculate change from previous period (in a real app, this would come from props or API)
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calculate percentages
  const positivePct = calculatePercentage(positive, total);
  const neutralPct = calculatePercentage(neutral, total);
  const negativePct = calculatePercentage(negative, total);
  
  // Mock previous period data (replace with actual data from props/API)
  const previousPeriodData = {
    positive: positive > 0 ? positive * 0.88 : 0, // 12% less than current
    neutral: neutral > 0 ? neutral * 1.05 : 0,    // 5% less than current
    negative: negative > 0 ? negative * 0.92 : 0  // 8% less than current
  };

  // Calculate changes
  const positiveChange = calculateChange(positive, previousPeriodData.positive);
  const neutralChange = calculateChange(neutral, previousPeriodData.neutral);
  const negativeChange = calculateChange(negative, previousPeriodData.negative);

  return (
    <Box sx={{ py: 2 }}>
      <Box mb={4}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Sentiment Overview
        </Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>
          Analysis of brand sentiment across all platforms
        </Typography>
      </Box>
      
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 4,
        width: '100%',
      }}>
        {/* Positive Card */}
        <StatCard>
          <StatCardContent>
            <SentimentIcon sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)' }}>
              <PositiveIcon color="success" />
            </SentimentIcon>
            <StatValue>{positive}</StatValue>
            <StatLabel>Positive Mentions</StatLabel>
            <StatChange positive={positiveChange >= 0}>
              {positiveChange >= 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              {Math.abs(positiveChange)}% from last period
            </StatChange>
            <Box width="100%" mt={2}>
              <LinearProgress 
                variant="determinate" 
                value={positivePct} 
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.success.main,
                    borderRadius: 4,
                    transition: 'transform 0.4s ease',
                  },
                }}
              />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption" color="textSecondary">
                  {positivePct}% of total
                </Typography>
              </Box>
            </Box>
          </StatCardContent>
        </StatCard>
        
        {/* Neutral Card */}
        <StatCard>
          <StatCardContent>
            <SentimentIcon sx={{ bgcolor: 'rgba(245, 124, 0, 0.1)' }}>
              <NeutralIcon color="warning" />
            </SentimentIcon>
            <StatValue>{neutral}</StatValue>
            <StatLabel>Neutral Mentions</StatLabel>
            <StatChange positive={neutralChange >= 0}>
              {neutralChange >= 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              {Math.abs(neutralChange)}% from last period
            </StatChange>
            <Box width="100%" mt={2}>
              <LinearProgress 
                variant="determinate" 
                value={neutralPct} 
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(245, 124, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.warning.main,
                    borderRadius: 4,
                    transition: 'transform 0.4s ease 0.1s',
                  },
                }}
              />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption" color="textSecondary">
                  {neutralPct}% of total
                </Typography>
              </Box>
            </Box>
          </StatCardContent>
        </StatCard>
        
        {/* Negative Card */}
        <StatCard>
          <StatCardContent>
            <SentimentIcon sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)' }}>
              <NegativeIcon color="error" />
            </SentimentIcon>
            <StatValue>{negative}</StatValue>
            <StatLabel>Negative Mentions</StatLabel>
            <StatChange positive={negativeChange <= 0}>
              {negativeChange <= 0 ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
              {Math.abs(negativeChange)}% from last period
            </StatChange>
            <Box width="100%" mt={2}>
              <LinearProgress 
                variant="determinate" 
                value={negativePct} 
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.error.main,
                    borderRadius: 4,
                    transition: 'transform 0.4s ease 0.2s',
                  },
                }}
              />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption" color="textSecondary">
                  {negativePct}% of total
                </Typography>
              </Box>
            </Box>
          </StatCardContent>
        </StatCard>
      </Box>
      
      {total > 0 && (
        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="textSecondary">
            Analyzing {total} total mentions across all platforms
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SentimentSummary;
