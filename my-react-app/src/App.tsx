import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Box, Typography, AppBar, Toolbar, CircularProgress, Alert, Snackbar } from '@mui/material';
import { deepPurple, teal, orange, red, blueGrey } from '@mui/material/colors';
import './App.css';
import SentimentSummary from './components/SentimentSummary';
import PlatformDistribution from './components/PlatformDistribution';
import MentionsTimeline from './components/MentionsTimeline';
import TopMentions from './components/TopMentions';
import WordCloud from './components/WordCloud';

import {
  fetchSentimentSummary,
  fetchPlatformStats,
  fetchTimelineData,
  fetchTopMentions,
  type SentimentSummary as SentimentSummaryType,
  type PlatformStat,
  type TimelineDataPoint,
  type TopMentionsResponse
} from './services/api';

//theme instance
const theme = createTheme({
  palette: {
    primary: deepPurple,
    secondary: teal,
    warning: orange,
    error: red,
    background: {
      default: blueGrey[50],
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
  },
});

interface AppData {
  sentimentSummary: SentimentSummaryType | null;
  platformData: PlatformStat[];
  timelineData: TimelineDataPoint[];
  topMentions: TopMentionsResponse;
  loading: boolean;
  error: string | null;
}

const getDefaultColor = (platformName: string): string => {
  const platformColors: Record<string, string> = {
    'twitter': '#1DA1F2',    // Twitter blue
    'facebook': '#1877F2',   // Facebook blue
    'instagram': '#E4405F',  // Instagram pink
    'reddit': '#FF5700',     // Reddit orange
    'youtube': '#FF0000',    
    'linkedin': '#0A66C2',   
  };
  
  const lowerName = platformName.toLowerCase();
  return platformColors[lowerName] || '#6c757d'; 
};

const initialState: AppData = {
  sentimentSummary: null,
  platformData: [],
  timelineData: [],
  topMentions: { positive: [], negative: [] },
  loading: true,
  error: null,
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(initialState);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showError = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const fetchData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      const [sentimentSummary, platformData, timelineData, topMentions] = await Promise.all([
        fetchSentimentSummary(),
        fetchPlatformStats(),
        fetchTimelineData(),
        fetchTopMentions(6, 30)
      ]);

      console.log('API Response - Sentiment Summary:', JSON.stringify(sentimentSummary, null, 2));
      console.log('API Response - Platform Data:', JSON.stringify(platformData, null, 2));
      console.log('API Response - Timeline Data:', JSON.stringify(timelineData, null, 2));
      console.log('API Response - Top Mentions:', JSON.stringify(topMentions, null, 2));

      setData({
        sentimentSummary,
        platformData,
        timelineData,
        topMentions,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      showError(errorMessage);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (data.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading data: {data.error}
        </Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              LeapScholar Perception Monitor
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
          {/* Sentiment Summary */}
          {data.sentimentSummary && (
            <SentimentSummary data={data.sentimentSummary} />
          )}

          {/* Charts Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Platform Distribution
              </Typography>
              <PlatformDistribution platforms={data.platformData.map(platform => ({
                ...platform,
                color: platform.color || getDefaultColor(platform.name)
              }))} />
            </Box>
            <Box>
              <Typography variant="h5" gutterBottom>
                Mentions Timeline
              </Typography>
              <MentionsTimeline data={data.timelineData} />
            </Box>
          </Box>

          {/* Top Mentions */}
          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              Top Mentions
            </Typography>
            <TopMentions data={data.topMentions} />
          </Box>

          {/* Word Cloud */}
          <Box>
            <Typography variant="h5" gutterBottom>
              Trending Topics
            </Typography>
            <WordCloud />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
