'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WeightReading } from '@/types/weight';
import { formatWeight } from '@/lib/weight-utils';

export default function DashboardWeightChart() {
  const [recentReadings, setRecentReadings] = useState<WeightReading[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize chart data processing - MUST be before conditional returns
  const chartData = useMemo(() => {
    return recentReadings
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(reading => ({
        date: new Date(reading.timestamp).toLocaleDateString(),
        weight: reading.weight,
        formattedWeight: formatWeight(reading.weight)
      }));
  }, [recentReadings]);

  useEffect(() => {
    const fetchRecentReadings = async () => {
      try {
        const response = await fetch('/api/weight?limit=10');
        if (response.ok) {
          const data = await response.json();
          setRecentReadings(data.readings);
        }
      } catch (error) {
        console.error('Error fetching recent weight readings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReadings();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (recentReadings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weight Trends</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No weight readings yet. Add your first weight reading to see trends!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Weight Trends</h3>
        <a 
          href="/weight"
          className="text-purple-500 hover:text-purple-600 text-sm font-medium"
        >
          View All →
        </a>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-800">{label}</p>
                      <p className="text-purple-600">Weight: {data.formattedWeight}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              name="Weight"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Weight (kg)</span>
        </div>
      </div>
    </div>
  );
}
