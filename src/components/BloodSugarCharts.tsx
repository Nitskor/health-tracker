'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BloodSugarReading, ReadingType } from '@/types/blood-sugar';
import { getReadingTypeColor, getReadingTypeLabel } from '@/lib/blood-sugar-utils';

interface BloodSugarChartsProps {
  readings: BloodSugarReading[];
  onFilteredReadingsChange?: (filteredReadings: BloodSugarReading[]) => void;
}

export default function BloodSugarCharts({ readings, onFilteredReadingsChange }: BloodSugarChartsProps) {
  const [timeFilter, setTimeFilter] = useState<number>(30); // days
  const [readingTypeFilter, setReadingTypeFilter] = useState<ReadingType | 'all'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string } | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Filter readings based on time and type
  const filteredReadings = useMemo(() => {
    let filtered = [...readings];

    // Apply date filter
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (customDateRange) {
      startDate = new Date(customDateRange.start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - timeFilter);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    filtered = filtered.filter((reading) => {
      const readingDate = new Date(reading.timestamp);
      return readingDate >= startDate && readingDate <= endDate;
    });

    // Apply reading type filter
    if (readingTypeFilter !== 'all') {
      filtered = filtered.filter((reading) => reading.readingType === readingTypeFilter);
    }

    return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [readings, timeFilter, readingTypeFilter, customDateRange]);

  // Notify parent of filtered readings changes
  useEffect(() => {
    if (onFilteredReadingsChange && filteredReadings.length > 0) {
      const timeoutId = setTimeout(() => {
        onFilteredReadingsChange(filteredReadings);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [filteredReadings, onFilteredReadingsChange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (filteredReadings.length === 0) return [];

    // Group by date
    const groupedByDate = filteredReadings.reduce((acc: any, reading) => {
      const date = new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(reading);
      return acc;
    }, {});

    return Object.entries(groupedByDate).map(([date, readings]: [string, any]) => {
      const avgGlucose = Math.round(
        readings.reduce((sum: number, r: any) => sum + r.glucose, 0) / readings.length
      );

      return {
        date,
        glucose: avgGlucose,
        count: readings.length,
      };
    });
  }, [filteredReadings]);

  // Comparison data by reading type
  const comparisonData = useMemo(() => {
    if (filteredReadings.length === 0) return [];

    const types: ReadingType[] = ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random'];
    return types.map((type) => {
      const typeReadings = filteredReadings.filter((r) => r.readingType === type);
      const avgGlucose = typeReadings.length > 0
        ? Math.round(typeReadings.reduce((sum, r) => sum + r.glucose, 0) / typeReadings.length)
        : 0;

      return {
        type: getReadingTypeLabel(type),
        glucose: avgGlucose,
        count: typeReadings.length,
        color: getReadingTypeColor(type),
      };
    }).filter((item) => item.count > 0);
  }, [filteredReadings]);

  const handleCustomDateApply = () => {
    if (customDateRange?.start && customDateRange?.end) {
      setShowCustomDatePicker(false);
    }
  };

  if (readings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No blood sugar readings yet. Add your first reading to see charts!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-4">
          {/* Reading Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reading Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setReadingTypeFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  readingTypeFilter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Readings
              </button>
              <button
                onClick={() => setReadingTypeFilter('fasting')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  readingTypeFilter === 'fasting'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Fasting
              </button>
              <button
                onClick={() => setReadingTypeFilter('before_meal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  readingTypeFilter === 'before_meal'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Before Meal
              </button>
              <button
                onClick={() => setReadingTypeFilter('after_meal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  readingTypeFilter === 'after_meal'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                After Meal
              </button>
              <button
                onClick={() => setReadingTypeFilter('bedtime')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  readingTypeFilter === 'bedtime'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bedtime
              </button>
              <button
                onClick={() => setReadingTypeFilter('random')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  readingTypeFilter === 'random'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Random
              </button>
            </div>
          </div>

          {/* Time Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setTimeFilter(7);
                  setCustomDateRange(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === 7 && !customDateRange
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 days
              </button>
              <button
                onClick={() => {
                  setTimeFilter(30);
                  setCustomDateRange(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === 30 && !customDateRange
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 days
              </button>
              <button
                onClick={() => {
                  setTimeFilter(90);
                  setCustomDateRange(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === 90 && !customDateRange
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                90 days
              </button>
              <button
                onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  customDateRange
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Range
              </button>
            </div>

            {/* Custom Date Range Picker */}
            {showCustomDatePicker && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customDateRange?.start || ''}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value } as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-900 font-medium"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customDateRange?.end || ''}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value } as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-900 font-medium"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleCustomDateApply}
                  className="w-full px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Glucose Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Glucose Trend - {readingTypeFilter !== 'all' ? getReadingTypeLabel(readingTypeFilter) : 'All Types'}
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="glucose" stroke="#10B981" strokeWidth={2} name="Glucose" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">No data for selected filters</p>
        )}
      </div>

      {/* Comparison by Reading Type */}
      {readingTypeFilter === 'all' && comparisonData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average by Reading Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="glucose" fill="#10B981" name="Average Glucose" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

