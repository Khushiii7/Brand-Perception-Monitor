import React, { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface Word {
  text: string;
  value: number;
  color?: string;
}

interface WordCloudProps {
  words?: Word[];
  title?: string;
}

const CloudContainer = styled(Box)({
  width: '100%',
  minHeight: 400,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  borderRadius: 8,
  border: '1px dashed rgba(0, 0, 0, 0.12)',
});

const CloudTitle = styled(Typography)({
  textAlign: 'center',
  marginBottom: 24,
  fontWeight: 500,
});

const CloudContent = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  maxWidth: 800,
  margin: '0 auto',
});

const WordItem = styled('span')(({ size, color }: { size: number; color: string }) => ({
  display: 'inline-block',
  margin: '4px 8px',
  padding: '4px 8px',
  borderRadius: 4,
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  fontSize: `${Math.max(12, Math.min(24, size * 0.5))}px`,
  color: color,
  opacity: 0.8 + (size / 50) * 0.2,
}));

const WordCloud: React.FC<WordCloudProps> = ({ 
  words = [], 
  title = 'Frequently Mentioned Terms' 
}) => {
  const theme = useTheme();
  
  const wordData = useMemo(() => {
    if (words && words.length > 0) {
      return words;
    }
    
    return [
      { text: 'education', value: 100 },
      { text: 'study', value: 90 },
      { text: 'abroad', value: 85 },
      { text: 'university', value: 80 },
      { text: 'student', value: 75 },
      { text: 'scholarship', value: 70 },
      { text: 'learning', value: 65 },
      { text: 'course', value: 60 },
      { text: 'degree', value: 55 },
      { text: 'campus', value: 50 },
      { text: 'international', value: 45 },
      { text: 'admission', value: 40 },
      { text: 'application', value: 35 },
      { text: 'program', value: 30 },
      { text: 'career', value: 25 },
    ];
  }, [words]);

  const colorOptions = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ], [theme]);

  const getColor = (value: number) => {
    const index = Math.min(
      Math.floor((value / 100) * (colorOptions.length - 1)),
      colorOptions.length - 1
    );
    return colorOptions[index];
  };

  const getFontSize = (value: number) => {
    const minSize = 12;
    const maxSize = 48;
    return minSize + (value / 100) * (maxSize - minSize);
  };

  const handleWordClick = (word: Word) => {
    console.log('Word clicked:', word);
  };

  return (
    <CloudContainer>
      <CloudTitle variant="h6">{title}</CloudTitle>
      <CloudContent>
        {wordData.map((word, index) => {
          const color = word.color || getColor(word.value);
          const size = getFontSize(word.value);
          
          return (
            <WordItem 
              key={`${word.text}-${index}`}
              size={size}
              color={color}
              onClick={() => handleWordClick(word)}
              title={`${word.text}: ${word.value}`}
            >
              {word.text}
            </WordItem>
          );
        })}
      </CloudContent>
    </CloudContainer>
  );
};

export default WordCloud;
