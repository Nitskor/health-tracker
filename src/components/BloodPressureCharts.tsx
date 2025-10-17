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
  ReferenceArea
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
  const [timeFilter, setTimeFilter] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Process data for charts
  const { normalData, afterActivityData, filteredReadings } = useMemo(() => {
    if (!readings || readings.length === 0) {
      return { normalData: [], afterActivityData: [], filteredReadings: [] };
    }

    // Filter by time
    const filteredReadings = readings.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      
      if (timeFilter === 'custom') {
        const startDate = new Date(customDateRange.start + 'T00:00:00.000Z');
        const endDate = new Date(customDateRange.end + 'T23:59:59.999Z');
        return readingDate >= startDate && readingDate <= endDate;
      } else {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeFilter));
        return readingDate >= cutoffDate;
      }
    });

    // Separate by type
    const normalReadings = filteredReadings.filter(r => r.readingType === 'normal');
    const afterActivityReadings = filteredReadings.filter(r => r.readingType === 'after_activity');

    // Group normal readings by date
    const normalGrouped: { [key: string]: BloodPressureReading[] } = {};
    normalReadings.forEach(reading => {
      const date = new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!normalGrouped[date]) normalGrouped[date] = [];
      normalGrouped[date].push(reading);
    });

    const normalData = Object.entries(normalGrouped)
      .map(([date, readings]) => ({
        date,
        systolic: Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length),
        diastolic: Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length),
        timestamp: new Date(readings[0].timestamp).getTime()
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Group after activity readings by date
    const afterActivityGrouped: { [key: string]: BloodPressureReading[] } = {};
    afterActivityReadings.forEach(reading => {
      const date = new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!afterActivityGrouped[date]) afterActivityGrouped[date] = [];
      afterActivityGrouped[date].push(reading);
    });

    const afterActivityData = Object.entries(afterActivityGrouped)
      .map(([date, readings]) => ({
        date,
        systolic: Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length),
        diastolic: Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length),
        timestamp: new Date(readings[0].timestamp).getTime()
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return { normalData, afterActivityData, filteredReadings };
  }, [readings, timeFilter, customDateRange]);

  // Notify parent of filtered readings
  useEffect(() => {
    if (onFilteredReadingsChange && filteredReadings.length >= 0) {
      const timeoutId = setTimeout(() => {
        onFilteredReadingsChange(filteredReadings);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [filteredReadings, onFilteredReadingsChange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-gray-200 rounded-xl shadow-lg">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          <p className="text-blue-600 font-semibold">Systolic: {payload[0]?.value} mmHg</p>
          <p className="text-purple-600 font-semibold">Diastolic: {payload[1]?.value} mmHg</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Time Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-900">Blood Pressure Trends</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTimeFilter('7')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeFilter === '7'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setTimeFilter('30')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeFilter === '30'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              30 days
            </button>
            <button
              onClick={() => setTimeFilter('90')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeFilter === '90'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              90 days
            </button>
            <button
              onClick={() => setTimeFilter('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeFilter === 'custom'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {timeFilter === 'custom' && (
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Normal Readings Chart */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              Normal Readings
            </h4>
            <span className="text-sm text-gray-500">{normalData.length} data points</span>
          </div>
          
          {normalData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  
                  {/* Reference Areas for BP Categories - More Visible */}
                  <ReferenceArea y1={0} y2={120} fill="#10b981" fillOpacity={0.15} label={{ value: 'Normal', position: 'insideTopRight', fill: '#059669', fontSize: 11, fontWeight: 600 }} />
                  <ReferenceArea y1={120} y2={130} fill="#f59e0b" fillOpacity={0.2} label={{ value: 'Elevated', position: 'insideTopRight', fill: '#d97706', fontSize: 11, fontWeight: 600 }} />
                  <ReferenceArea y1={130} y2={200} fill="#ef4444" fillOpacity={0.15} label={{ value: 'High', position: 'insideTopRight', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
                  
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[60, 180]}
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'mmHg', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="systolic" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Systolic"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Diastolic"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-gray-500">No normal readings in this time period</p>
            </div>
          )}
        </div>

        {/* After Activity Readings Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-purple-600 flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              After Activity Readings
            </h4>
            <span className="text-sm text-gray-500">{afterActivityData.length} data points</span>
          </div>
          
          {afterActivityData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={afterActivityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  
                  {/* Reference Areas for BP Categories - More Visible */}
                  <ReferenceArea y1={0} y2={120} fill="#10b981" fillOpacity={0.15} label={{ value: 'Normal', position: 'insideTopRight', fill: '#059669', fontSize: 11, fontWeight: 600 }} />
                  <ReferenceArea y1={120} y2={130} fill="#f59e0b" fillOpacity={0.2} label={{ value: 'Elevated', position: 'insideTopRight', fill: '#d97706', fontSize: 11, fontWeight: 600 }} />
                  <ReferenceArea y1={130} y2={200} fill="#ef4444" fillOpacity={0.15} label={{ value: 'High', position: 'insideTopRight', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
                  
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[60, 180]}
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'mmHg', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="systolic" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Systolic"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#ec4899" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#ec4899', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Diastolic"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-gray-500">No after-activity readings in this time period</p>
            </div>
          )}
        </div>

        {/* Legend for Reference Zones */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Blood Pressure Categories:</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 bg-opacity-30 border border-green-500 rounded"></div>
              <span className="text-gray-600">Normal (&lt;120)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 bg-opacity-30 border border-yellow-500 rounded"></div>
              <span className="text-gray-600">Elevated (120-130)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 bg-opacity-30 border border-red-500 rounded"></div>
              <span className="text-gray-600">High (&gt;130)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
