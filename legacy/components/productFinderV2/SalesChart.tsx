
import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface SalesChartProps {
    data: { day: string; value: number }[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  return (
    <div className="h-12 w-32">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Tooltip cursor={false} content={() => null} />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366f1" 
                    strokeWidth={2} 
                    fill="url(#colorSales)" 
                />
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
