import { Box, Typography, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { styled } from '@mui/material/styles';


//platform data
export interface PlatformData {
  name: string;
  value: number;
  total: number;
  color: string;
  icon?: React.ReactNode;
}

const ChartContainer = styled(Box)({
  width: '100%',
  height: '100%',
  minHeight: 300,
  display: 'flex',
  flexDirection: 'column',
});

const ChartWrapper = styled(Box)({
  flex: 1,
  minHeight: 250,
});

const ChartTitle = styled(Typography)({
  textAlign: 'center',
  marginBottom: 16,
  fontWeight: 500,
});

const LegendContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  marginTop: 16,
  gap: 8,
});

const LegendItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  margin: '0 8px',
  fontSize: '0.75rem',
});

const LegendColor = styled(Box)({
  width: 12,
  height: 12,
  borderRadius: '50%',
  marginRight: 4,
});

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      total: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box sx={{ 
        backgroundColor: 'background.paper', 
        p: 1, 
        border: '1px solid #ccc',
        borderRadius: 1,
        boxShadow: 1
      }}>
        {/* name */}
        <Typography variant="body2">{data.name}</Typography>
        {/* mentions */}
        <Typography variant="body2">
          Mentions: <strong>{data.value}</strong>
        </Typography>
        {/* percentage */}
        <Typography variant="body2" color="textSecondary">
          {((data.value / data.total) * 100).toFixed(1)}% of total
        </Typography>
      </Box>
    );
  }
  return null;
};

interface PlatformDistributionProps {
  platforms?: PlatformData[];
}

//platform distribution
const PlatformDistribution: React.FC<PlatformDistributionProps> = ({ platforms = [] }) => {
  const theme = useTheme();
  
  if (!platforms || platforms.length === 0) {
    return (
      //platform data not
      <ChartContainer>
        <ChartTitle variant="subtitle1">Platform Distribution</ChartTitle>
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <Typography color="textSecondary">No platform data available</Typography>
        </Box>
      </ChartContainer>
    );
  }

  const total = platforms.reduce((sum, item) => sum + item.value, 0);
  const data = platforms.map(item => ({
    ...item,
    total: item.total || total,
  }));

  return (
    //platform distribution
    <ChartContainer>
      <ChartTitle variant="subtitle1">Platform Distribution</ChartTitle>
      <ChartWrapper>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>

            {/* tooltip */}
            <Tooltip content={<CustomTooltip />} />
            
            {/* legend */}
            <Legend 
              content={({ payload }) => (
                <LegendContainer>
                  {payload?.map((entry, index) => (
                    <LegendItem key={`legend-${index}`}>
                      <LegendColor style={{ backgroundColor: entry.color }} />
                      <span>{entry.value}</span>
                    </LegendItem>
                  ))}
                </LegendContainer>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartContainer>
  );
};

export default PlatformDistribution;
