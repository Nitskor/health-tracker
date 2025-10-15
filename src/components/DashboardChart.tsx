'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BloodPressureReading } from '@/types/blood-pressure';

export default function DashboardChart() {
  const [recentReadings, setRecentReadings] = useState<BloodPressureReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentReadings();
  }, []);

  const fetchRecentReadings = async () => {
    try {
      const response = await fetch('/api/blood-pressure?limit=10');
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Blood Pressure Trends</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No readings yet. Add your first blood pressure reading to see trends!</p>
        </div>
      </div>
    );
  }

  // Process data for the chart
  const chartData = recentReadings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(reading => ({
      date: new Date(reading.timestamp).toLocaleDateString(),
      systolic: reading.systolic,
      diastolic: reading.diastolic,
      type: reading.readingType
    }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Blood Pressure Trends</h3>
        <a 
          href="/blood-pressure"
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
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
              label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-800">{label}</p>
                      <p className="text-blue-600">Systolic: {data.systolic} mmHg</p>
                      <p className="text-purple-600">Diastolic: {data.diastolic} mmHg</p>
                      <p className="text-sm text-gray-600">
                        Type: {data.type === 'normal' ? 'Normal' : 'After Activity'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="systolic" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              name="Systolic"
            />
            <Line 
              type="monotone" 
              dataKey="diastolic" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              name="Diastolic"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Systolic</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Diastolic</span>
        </div>
      </div>
    </div>
  );
}
