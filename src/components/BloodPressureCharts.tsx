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

export default function BloodPressureCharts({ readings, onFilteredReadingsChange }: BloodPressureChartsProps) {
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
        bpm: Math.round(readings.reduce((sum, r) => sum + r.bpm, 0) / readings.length),
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
        bpm: Math.round(readings.reduce((sum, r) => sum + r.bpm, 0) / readings.length),
        maxBpm: readings[0].maxBpmDuringWalk ? Math.round(readings.reduce((sum, r) => sum + (r.maxBpmDuringWalk || 0), 0) / readings.length) : undefined,
        walkDuration: readings[0].walkDuration,
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

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { systolic: number; diastolic: number; bpm: number; maxBpm?: number; walkDuration?: number } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border-2 border-gray-200 rounded-xl shadow-lg">
          <p className="font-bold text-gray-800 mb-3">{label}</p>
          <div className="space-y-1">
            <p className="text-blue-600 font-semibold">Systolic: {data.systolic} mmHg</p>
            <p className="text-purple-600 font-semibold">Diastolic: {data.diastolic} mmHg</p>
            <p className="text-red-500 font-semibold flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              BPM: {data.bpm}
            </p>
            {data.maxBpm && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <p className="text-gray-600 text-sm">Walk: {data.walkDuration} min</p>
                <p className="text-pink-600 font-semibold text-sm">Peak BPM: {data.maxBpm}</p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Time Filter Tabs */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-900">BP Trends</h3>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <button
              onClick={() => setTimeFilter('7')}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all ${
                timeFilter === '7'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              7d
            </button>
            <button
              onClick={() => setTimeFilter('30')}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all ${
                timeFilter === '30'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              30d
            </button>
            <button
              onClick={() => setTimeFilter('90')}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all ${
                timeFilter === '90'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              90d
            </button>
            <button
              onClick={() => setTimeFilter('custom')}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all ${
                timeFilter === 'custom'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {timeFilter === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 min-w-[45px]">From:</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                style={{ colorScheme: 'light' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 min-w-[45px]">To:</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>
        )}

        {/* Normal Readings - Blood Pressure Chart */}
        <div className="mb-4 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 md:mb-4">
            <h4 className="text-base md:text-lg font-bold text-blue-600 flex items-center gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full"></div>
              <span className="hidden sm:inline">Normal Readings - Blood Pressure</span>
              <span className="sm:hidden">Normal BP</span>
            </h4>
            <span className="text-xs md:text-sm text-gray-500">{normalData.length} points</span>
          </div>
          
          {normalData.length > 0 ? (
            <div className="h-56 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normalData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  
                  {/* Reference Areas for BP Categories */}
                  <ReferenceArea y1={0} y2={120} fill="#10b981" fillOpacity={0.15} label={{ value: 'Normal', position: 'insideTopRight', fill: '#059669', fontSize: 9, fontWeight: 600 }} />
                  <ReferenceArea y1={120} y2={130} fill="#f59e0b" fillOpacity={0.2} label={{ value: 'Elevated', position: 'insideTopRight', fill: '#d97706', fontSize: 9, fontWeight: 600 }} />
                  <ReferenceArea y1={130} y2={200} fill="#ef4444" fillOpacity={0.15} label={{ value: 'High', position: 'insideTopRight', fill: '#dc2626', fontSize: 9, fontWeight: 600 }} />
                  
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[60, 180]}
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                    width={35}
                    label={{ value: 'mmHg', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
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
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Systolic"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Diastolic"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 md:h-80 flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-sm md:text-base text-gray-500">No normal readings in this time period</p>
            </div>
          )}
        </div>

        {/* Normal Readings - Heart Rate Chart */}
        <div className="mb-4 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 md:mb-4">
            <h4 className="text-base md:text-lg font-bold text-red-600 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Normal Readings - Heart Rate</span>
              <span className="sm:hidden">Normal Heart Rate</span>
            </h4>
            <span className="text-xs md:text-sm text-gray-500">{normalData.length} points</span>
          </div>
          
          {normalData.length > 0 ? (
            <div className="h-56 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normalData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  
                  {/* Reference Areas for Heart Rate */}
                  <ReferenceArea y1={60} y2={100} fill="#10b981" fillOpacity={0.1} label={{ value: 'Normal HR', position: 'insideTopRight', fill: '#059669', fontSize: 11 }} />
                  
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[30, 120]}
                    tick={{ fontSize: 10 }}
                    stroke="#ef4444"
                    width={35}
                    label={{ value: 'BPM', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#ef4444' } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bpm" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Heart Rate (BPM)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 md:h-80 flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-sm md:text-base text-gray-500">No normal readings in this time period</p>
            </div>
          )}
        </div>

        {/* After Activity Readings - Blood Pressure Chart */}
        <div className="mb-4 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 md:mb-4">
            <h4 className="text-base md:text-lg font-bold text-purple-600 flex items-center gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-500 rounded-full"></div>
              <span className="hidden sm:inline">After Activity Readings - Blood Pressure</span>
              <span className="sm:hidden">Activity BP</span>
            </h4>
            <span className="text-xs md:text-sm text-gray-500">{afterActivityData.length} points</span>
          </div>
          
          {afterActivityData.length > 0 ? (
            <div className="h-56 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={afterActivityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  
                  {/* Reference Areas for BP Categories */}
                  <ReferenceArea y1={0} y2={120} fill="#10b981" fillOpacity={0.15} label={{ value: 'Normal', position: 'insideTopRight', fill: '#059669', fontSize: 9, fontWeight: 600 }} />
                  <ReferenceArea y1={120} y2={130} fill="#f59e0b" fillOpacity={0.2} label={{ value: 'Elevated', position: 'insideTopRight', fill: '#d97706', fontSize: 9, fontWeight: 600 }} />
                  <ReferenceArea y1={130} y2={200} fill="#ef4444" fillOpacity={0.15} label={{ value: 'High', position: 'insideTopRight', fill: '#dc2626', fontSize: 9, fontWeight: 600 }} />
                  
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[60, 180]}
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                    width={35}
                    label={{ value: 'mmHg', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
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
                    dot={{ fill: '#a855f7', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Systolic"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#ec4899" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#ec4899', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Diastolic"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 md:h-80 flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-sm md:text-base text-gray-500">No after-activity readings in this time period</p>
            </div>
          )}
        </div>

        {/* After Activity Readings - Heart Rate Chart */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 md:mb-4">
            <h4 className="text-base md:text-lg font-bold text-orange-600 flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">After Activity Readings - Heart Rate</span>
              <span className="sm:hidden">Activity Heart Rate</span>
            </h4>
            <span className="text-xs md:text-sm text-gray-500">{afterActivityData.length} points</span>
          </div>
          
          {afterActivityData.length > 0 ? (
            <div className="h-56 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={afterActivityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  
                  {/* Reference Areas for Heart Rate */}
                  <ReferenceArea y1={60} y2={100} fill="#10b981" fillOpacity={0.1} label={{ value: 'Normal HR', position: 'insideTopLeft', fill: '#059669', fontSize: 11 }} />
                  <ReferenceArea y1={100} y2={120} fill="#f59e0b" fillOpacity={0.1} label={{ value: 'Elevated HR', position: 'insideTopLeft', fill: '#d97706', fontSize: 11 }} />
                  
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[30, 120]}
                    tick={{ fontSize: 10 }}
                    stroke="#f97316"
                    width={35}
                    label={{ value: 'BPM', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#f97316' } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bpm" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Resting BPM"
                  />
                  {afterActivityData.some(d => d.maxBpm) && (
                    <Line 
                      type="monotone" 
                      dataKey="maxBpm" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Peak BPM During Walk"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 md:h-80 flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-sm md:text-base text-gray-500">No after-activity readings in this time period</p>
            </div>
          )}
        </div>

        {/* Legend for Reference Zones */}
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
          <p className="text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3">Blood Pressure Categories:</p>
          <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 bg-opacity-30 border border-green-500 rounded"></div>
              <span className="text-gray-600">Normal (&lt;120)</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-500 bg-opacity-30 border border-yellow-500 rounded"></div>
              <span className="text-gray-600">Elevated (120-130)</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-red-500 bg-opacity-30 border border-red-500 rounded"></div>
              <span className="text-gray-600">High (&gt;130)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
