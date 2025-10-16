'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { WeightReading, WeightStats } from '@/types/weight';
import { formatWeight } from '@/lib/weight-utils';

interface WeightChartsProps {
  readings: WeightReading[];
  stats: WeightStats;
  onFilteredReadingsChange?: (filteredReadings: WeightReading[]) => void;
}

export default function WeightCharts({ readings, stats, onFilteredReadingsChange }: WeightChartsProps) {
  const [selectedChart, setSelectedChart] = useState<'trend' | 'comparison'>('trend');
  const [timeFilter, setTimeFilter] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Process data for charts
  const chartData = useMemo(() => {
    if (!readings || readings.length === 0) {
      return { trendData: [], filteredReadings: [] };
    }

    const filteredReadings = readings.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      
      // Time filter
      let timeMatch = false;
      if (timeFilter === 'custom') {
        // Create dates in UTC to avoid timezone issues
        const startDate = new Date(customDateRange.start + 'T00:00:00.000Z');
        const endDate = new Date(customDateRange.end + 'T23:59:59.999Z');
        timeMatch = readingDate >= startDate && readingDate <= endDate;
      } else {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeFilter));
        timeMatch = readingDate >= cutoffDate;
      }
      
      return timeMatch;
    });

    // Group by date and calculate daily averages
    const groupedData: { [key: string]: WeightReading[] } = {};
    
    filteredReadings.forEach(reading => {
      const date = new Date(reading.timestamp).toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = [];
      }
      groupedData[date].push(reading);
    });

    // Calculate daily averages
    const trendData = Object.entries(groupedData).map(([date, data]) => {
      const avgWeight = data.length > 0 ? 
        Math.round((data.reduce((sum, r) => sum + r.weight, 0) / data.length) * 10) / 10 : 0;

      return {
        date,
        weight: avgWeight,
        count: data.length
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { trendData, filteredReadings };
  }, [readings, timeFilter, customDateRange]);

  // Separate effect for notifying parent
  useEffect(() => {
    if (onFilteredReadingsChange && chartData.filteredReadings) {
      // Use setTimeout to prevent blocking the main thread
      const timeoutId = setTimeout(() => {
        onFilteredReadingsChange(chartData.filteredReadings);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [chartData.filteredReadings, onFilteredReadingsChange]);

  // Comparison data based on time filter
  const comparisonData = useMemo(() => {
    const filteredReadings = readings.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      
      // Time filter
      let timeMatch = false;
      if (timeFilter === 'custom') {
        // Create dates in UTC to avoid timezone issues
        const startDate = new Date(customDateRange.start + 'T00:00:00.000Z');
        const endDate = new Date(customDateRange.end + 'T23:59:59.999Z');
        timeMatch = readingDate >= startDate && readingDate <= endDate;
      } else {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeFilter));
        timeMatch = readingDate >= cutoffDate;
      }
      
      return timeMatch;
    });

    if (filteredReadings.length === 0) {
      return [];
    }

    const avgWeight = Math.round((filteredReadings.reduce((sum, r) => sum + r.weight, 0) / filteredReadings.length) * 10) / 10;
    const minWeight = Math.min(...filteredReadings.map(r => r.weight));
    const maxWeight = Math.max(...filteredReadings.map(r => r.weight));

    return [
      {
        metric: 'Average',
        weight: avgWeight,
        count: filteredReadings.length
      },
      {
        metric: 'Minimum',
        weight: minWeight,
        count: 1
      },
      {
        metric: 'Maximum',
        weight: maxWeight,
        count: 1
      }
    ];
  }, [readings, timeFilter, customDateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm">
                  {entry.name}: {entry.value ? `${entry.value} kg` : 'No data'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        {/* Chart Type Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedChart('trend')}
            className={`px-4 py-2 rounded-lg ${
              selectedChart === 'trend'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Trend
          </button>
          <button
            onClick={() => setSelectedChart('comparison')}
            className={`px-4 py-2 rounded-lg ${
              selectedChart === 'comparison'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Comparison
          </button>
        </div>

        {/* Time Period Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFilter('7')}
            className={`px-3 py-1 rounded ${
              timeFilter === '7'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setTimeFilter('30')}
            className={`px-3 py-1 rounded ${
              timeFilter === '30'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30 days
          </button>
          <button
            onClick={() => setTimeFilter('90')}
            className={`px-3 py-1 rounded ${
              timeFilter === '90'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            90 days
          </button>
          <button
            onClick={() => setTimeFilter('custom')}
            className={`px-3 py-1 rounded ${
              timeFilter === 'custom'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {timeFilter === 'custom' && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Select Date Range</h4>
          <div className="flex gap-4 items-center">
            <div>
              <label htmlFor="start-date" className="block text-xs text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                id="start-date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                id="end-date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {selectedChart === 'trend' && `Weight Trends (${timeFilter === 'custom' ? `${customDateRange.start} to ${customDateRange.end}` : `${timeFilter} days`})`}
          {selectedChart === 'comparison' && `Weight Statistics (${timeFilter === 'custom' ? `${customDateRange.start} to ${customDateRange.end}` : `${timeFilter} days`})`}
        </h3>

        <div className="h-96">
          {selectedChart === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    // Handle both date format and date+time format
                    if (value.includes(' ')) {
                      const [date, time] = value.split(' ');
                      return `${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
                    }
                    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis 
                  label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#666' } }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 12, fill: '#666' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="plainline" />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#8B5CF6" 
                  name="Weight" 
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'comparison' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis
                  label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#666' } }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 12, fill: '#666' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />
                <Bar dataKey="weight" fill="#8B5CF6" name="Weight" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
