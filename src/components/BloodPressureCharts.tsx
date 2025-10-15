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
import { BloodPressureReading } from '@/types/blood-pressure';

interface BloodPressureChartsProps {
  readings: BloodPressureReading[];
  stats: {
    normal: {
      count: number;
      averageSystolic: number;
      averageDiastolic: number;
    };
    afterActivity: {
      count: number;
      averageSystolic: number;
      averageDiastolic: number;
    };
  };
  onFilteredReadingsChange?: (filteredReadings: BloodPressureReading[]) => void;
}

export default function BloodPressureCharts({ readings, stats, onFilteredReadingsChange }: BloodPressureChartsProps) {
  const [selectedChart, setSelectedChart] = useState<'trend' | 'comparison'>('trend');
  const [timeFilter, setTimeFilter] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [readingTypeFilter, setReadingTypeFilter] = useState<'all' | 'normal' | 'after_activity'>('all');
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
      
      // Reading type filter
      const typeMatch = readingTypeFilter === 'all' || reading.readingType === readingTypeFilter;
      
      return timeMatch && typeMatch;
    });

    // Group by date and reading type
    const groupedData: { [key: string]: { normal: BloodPressureReading[], afterActivity: BloodPressureReading[] } } = {};
    
    filteredReadings.forEach(reading => {
      const date = new Date(reading.timestamp).toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = { normal: [], afterActivity: [] };
      }
      if (reading.readingType === 'normal') {
        groupedData[date].normal.push(reading);
      } else {
        groupedData[date].afterActivity.push(reading);
      }
    });

    // Calculate daily averages
    const trendData = Object.entries(groupedData).map(([date, data]) => {
      const normalAvg = data.normal.length > 0 ? {
        systolic: Math.round(data.normal.reduce((sum, r) => sum + r.systolic, 0) / data.normal.length),
        diastolic: Math.round(data.normal.reduce((sum, r) => sum + r.diastolic, 0) / data.normal.length)
      } : null;

      const afterActivityAvg = data.afterActivity.length > 0 ? {
        systolic: Math.round(data.afterActivity.reduce((sum, r) => sum + r.systolic, 0) / data.afterActivity.length),
        diastolic: Math.round(data.afterActivity.reduce((sum, r) => sum + r.diastolic, 0) / data.afterActivity.length)
      } : null;

      return {
        date,
        normalSystolic: normalAvg?.systolic || null,
        normalDiastolic: normalAvg?.diastolic || null,
        afterActivitySystolic: afterActivityAvg?.systolic || null,
        afterActivityDiastolic: afterActivityAvg?.diastolic || null,
        normalCount: data.normal.length,
        afterActivityCount: data.afterActivity.length
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { trendData, filteredReadings };
  }, [readings, timeFilter, readingTypeFilter, customDateRange]);

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

  // Comparison data based on time filter and reading type filter
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
      
      // Reading type filter
      const typeMatch = readingTypeFilter === 'all' || reading.readingType === readingTypeFilter;
      
      return timeMatch && typeMatch;
    });

    const normalReadings = filteredReadings.filter(r => r.readingType === 'normal');
    const afterActivityReadings = filteredReadings.filter(r => r.readingType === 'after_activity');

    const normalAvg = normalReadings.length > 0 ? {
      systolic: Math.round(normalReadings.reduce((sum, r) => sum + r.systolic, 0) / normalReadings.length),
      diastolic: Math.round(normalReadings.reduce((sum, r) => sum + r.diastolic, 0) / normalReadings.length)
    } : { systolic: 0, diastolic: 0 };

    const afterActivityAvg = afterActivityReadings.length > 0 ? {
      systolic: Math.round(afterActivityReadings.reduce((sum, r) => sum + r.systolic, 0) / afterActivityReadings.length),
      diastolic: Math.round(afterActivityReadings.reduce((sum, r) => sum + r.diastolic, 0) / afterActivityReadings.length)
    } : { systolic: 0, diastolic: 0 };

    return [
      {
        type: 'Normal',
        systolic: normalAvg.systolic,
        diastolic: normalAvg.diastolic,
        count: normalReadings.length
      },
      {
        type: 'After Activity',
        systolic: afterActivityAvg.systolic,
        diastolic: afterActivityAvg.diastolic,
        count: afterActivityReadings.length
      }
    ];
  }, [readings, timeFilter, readingTypeFilter, customDateRange]);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value} mmHg
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedChart('trend')}
            className={`px-4 py-2 rounded-lg ${
              selectedChart === 'trend' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Trend
          </button>
          <button
            onClick={() => setSelectedChart('comparison')}
            className={`px-4 py-2 rounded-lg ${
              selectedChart === 'comparison' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Comparison
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFilter('7')}
            className={`px-3 py-1 rounded ${
              timeFilter === '7' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setTimeFilter('30')}
            className={`px-3 py-1 rounded ${
              timeFilter === '30' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30 days
          </button>
          <button
            onClick={() => setTimeFilter('90')}
            className={`px-3 py-1 rounded ${
              timeFilter === '90' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            90 days
          </button>
          <button
            onClick={() => setTimeFilter('custom')}
            className={`px-3 py-1 rounded ${
              timeFilter === 'custom' 
                ? 'bg-blue-500 text-white' 
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
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                id="end-date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reading Type Filters */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setReadingTypeFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            readingTypeFilter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Readings
        </button>
        <button
          onClick={() => setReadingTypeFilter('normal')}
          className={`px-4 py-2 rounded-lg ${
            readingTypeFilter === 'normal' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Normal
        </button>
        <button
          onClick={() => setReadingTypeFilter('after_activity')}
          className={`px-4 py-2 rounded-lg ${
            readingTypeFilter === 'after_activity' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          After Activity
        </button>
      </div>

      {/* Chart Container */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {selectedChart === 'trend' && `Blood Pressure Trends (${timeFilter === 'custom' ? `${customDateRange.start} to ${customDateRange.end}` : `${timeFilter} days`}, ${readingTypeFilter === 'all' ? 'All Readings' : readingTypeFilter === 'normal' ? 'Normal' : 'After Activity'})`}
          {selectedChart === 'comparison' && `Reading Type Comparison (${timeFilter === 'custom' ? `${customDateRange.start} to ${customDateRange.end}` : `${timeFilter} days`}, ${readingTypeFilter === 'all' ? 'All Readings' : readingTypeFilter === 'normal' ? 'Normal' : 'After Activity'})`}
        </h3>
        
        <div className="h-96">
          {selectedChart === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="normalSystolic" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Normal Systolic"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="normalDiastolic" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Normal Diastolic"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="afterActivitySystolic" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="After Activity Systolic"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="afterActivityDiastolic" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="After Activity Diastolic"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'comparison' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="systolic" fill="#3B82F6" name="Systolic" />
                <Bar dataKey="diastolic" fill="#8B5CF6" name="Diastolic" />
              </BarChart>
            </ResponsiveContainer>
          )}

        </div>
      </div>
    </div>
  );
}
