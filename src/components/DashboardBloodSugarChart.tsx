'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BloodSugarReading } from '@/types/blood-sugar';
import { getReadingTypeLabel, getReadingTypeColor } from '@/lib/blood-sugar-utils';

export default function DashboardBloodSugarChart() {
  const [recentReadings, setRecentReadings] = useState<BloodSugarReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentReadings();
  }, []);

  const fetchRecentReadings = async () => {
    try {
      const response = await fetch('/api/blood-sugar?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentReadings(data.readings);
      }
    } catch (error) {
      console.error('Error fetching recent readings:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Blood Sugar Trends</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No readings yet. Add your first blood sugar reading to see trends!</p>
        </div>
      </div>
    );
  }

  // Process data for the chart
  const chartData = recentReadings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(reading => ({
      date: new Date(reading.timestamp).toLocaleDateString(),
      glucose: reading.glucose,
      type: reading.readingType
    }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Blood Sugar Trends</h3>
        <a 
          href="/blood-sugar"
          className="text-green-500 hover:text-green-600 text-sm font-medium"
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
              label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-800">{label}</p>
                      <p className="text-green-600">Glucose: {data.glucose} mg/dL</p>
                      <p className="text-sm text-gray-600">
                        Type: {getReadingTypeLabel(data.type)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="glucose" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              name="Glucose"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Glucose Level</span>
        </div>
      </div>
    </div>
  );
}

