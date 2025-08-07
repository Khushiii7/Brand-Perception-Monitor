import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { 
  ResponsiveContainer, 
  Area, 
  AreaChart, 
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { styled } from '@mui/material/styles';

//timeline data
type TimelineData = {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  total?: number;
};
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    payload: TimelineData;
  }>;
  label?: string;
}

interface AxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: string;
  };
}

interface MentionsTimelineProps {
  data?: TimelineData[];
}

//chart container
const ChartContainer = styled(Box)({
  width: '100%',
  height: '100%',
  minHeight: 400,
});

//chart title
const ChartTitle = styled(Typography)({
  textAlign: 'center',
  marginBottom: 16,
});

//custom tooltip
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ 
        backgroundColor: 'background.paper', 
        p: 1.5, 
        border: '1px solid #ccc',
        borderRadius: 1,
        boxShadow: 2,
        minWidth: 180
      }}>
        {/* date */}
        <Typography variant="subtitle2" gutterBottom>
          {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
        </Typography>
        {payload.map((entry, index) => (
          <Box key={`tooltip-${index}`} display="flex" justifyContent="space-between" mb={0.5}>
            <Box display="flex" alignItems="center">
              <Box 
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  borderRadius: '50%',
                  mr: 1
                }}
              />
              {/* name */}
              <Typography variant="body2">
                {entry.name}:
              </Typography>
            </Box>
            {/* value */}
            <Typography variant="body2" fontWeight="medium" ml={1}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

//custom axis tick
const CustomizedAxisTick: React.FC<AxisTickProps> = ({ x, y, payload }) => {
  if (!x || !y || !payload) return null;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
        {format(parseISO(payload.value), 'MMM d')}
      </text>
    </g>
  );
};

//mentions timeline
const MentionsTimeline: React.FC<MentionsTimelineProps> = ({ data = [] }) => {
  const theme = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <ChartContainer>
        <ChartTitle variant="h6">Mentions Over Time</ChartTitle>
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary">No timeline data available</Typography>
        </Box>
      </ChartContainer>
    );
  }

  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  //max value for y-axis
  const maxValue = Math.max(
    ...sortedData.map(d => Math.max(d.positive, d.neutral, d.negative))
  );
  const yAxisTicks = Array.from({ length: 5 }, (_, i) => 
    Math.ceil((maxValue * (i + 1)) / 5)
  );

  return (
    <ChartContainer>
      <ChartTitle variant="h6">Mentions Over Time</ChartTitle>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={sortedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          {/* defs */}
          <defs>
            {/* positive */}
            <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.2} />
              <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
            </linearGradient>
            {/* neutral */}
            <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.2} />
              <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.2} />
              <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          
          {/* x axis */}
          <XAxis 
            dataKey="date" 
            tick={<CustomizedAxisTick />}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
          />
          
          {/* y axis */}
          <YAxis 
            tickLine={false} 
            axisLine={{ stroke: theme.palette.divider }}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            ticks={yAxisTicks}
            domain={[0, 'dataMax']}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* legend */}
          <Legend 
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: theme.palette.text.primary, fontSize: '0.75rem' }}>
                {value}
              </span>
            )}
          />
          
          {/* positive */}
          <Area
            type="monotone"
            dataKey="positive"
            name="Positive"
            stroke={theme.palette.success.main}
            fillOpacity={1}
            fill="url(#colorPositive)"
            strokeWidth={2}
            dot={{ r: 2, strokeWidth: 2, fill: theme.palette.success.main }}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          
          {/* neutral */}
          <Area
            type="monotone"
            dataKey="neutral"
            name="Neutral"
            stroke={theme.palette.warning.main}
            fillOpacity={1}
            fill="url(#colorNeutral)"
            strokeWidth={2}
            dot={{ r: 2, strokeWidth: 2, fill: theme.palette.warning.main }}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          
          {/* negative */}
          <Area
            type="monotone"
            dataKey="negative"
            name="Negative"
            stroke={theme.palette.error.main}
            fillOpacity={1}
            fill="url(#colorNegative)"
            strokeWidth={2}
            dot={{ r: 2, strokeWidth: 2, fill: theme.palette.error.main }}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
export default MentionsTimeline;
