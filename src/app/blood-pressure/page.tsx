'use client';

import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import BloodPressureForm from '@/components/BloodPressureForm';
import { BloodPressureReading, BloodPressureStats } from '@/types/blood-pressure';
import { formatBloodPressure, getBloodPressureCategory, getReadingTypeLabel, getReadingTypeColor } from '@/lib/blood-pressure-utils';
import { exportBloodPressureToPDF } from '@/lib/pdf-export-utils';

// Lazy load the charts component for better initial load performance
const BloodPressureCharts = lazy(() => import('@/components/BloodPressureCharts'));

export default function BloodPressurePage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<BloodPressureReading[]>([]);
  const [stats, setStats] = useState<BloodPressureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReading, setEditingReading] = useState<BloodPressureReading | null>(null);
  const [deletingReading, setDeletingReading] = useState<BloodPressureReading | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn) {
      fetchData();
    }
  }, [isSignedIn]);

  // Optimized: Fetch readings and stats in parallel
  const fetchData = async () => {
    try {
      const [readingsResponse, statsResponse] = await Promise.all([
        fetch('/api/blood-pressure'),
        fetch('/api/blood-pressure/stats')
      ]);

      if (readingsResponse.ok) {
        const data = await readingsResponse.json();
        setReadings(data.readings);
      }

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async () => {
    try {
      const response = await fetch('/api/blood-pressure');
      if (response.ok) {
        const data = await response.json();
        setReadings(data.readings);
      }
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/blood-pressure/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingReading(null);
    fetchReadings();
    fetchStats();
  };

  const handleEditReading = (reading: BloodPressureReading) => {
    setEditingReading(reading);
    setShowForm(true);
  };

  const handleDeleteReading = async (reading: BloodPressureReading) => {
    if (!reading._id) return;

    try {
      const response = await fetch(`/api/blood-pressure?id=${reading._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete reading');
      }

      // Refresh data
      await fetchReadings();
      await fetchStats();
      setDeletingReading(null);
    } catch (error) {
      console.error('Error deleting reading:', error);
      alert('Failed to delete reading. Please try again.');
    }
  };

  const handleExportData = async () => {
    if (readings.length === 0) {
      alert('No data to export');
      return;
    }
    await exportBloodPressureToPDF(readings);
  };

  const handleFilteredReadingsChange = useCallback((filtered: BloodPressureReading[]) => {
    setFilteredReadings(filtered);
  }, []);

  // Initialize filtered readings with all readings when readings are first loaded
  useEffect(() => {
    if (readings.length > 0 && filteredReadings.length === 0) {
      setFilteredReadings(readings);
    }
  }, [readings, filteredReadings.length]);

  // Memoize grouped readings for better performance
  const groupedReadings = useMemo(() => {
    const readingsToShow = filteredReadings.length > 0 ? filteredReadings : readings;
    
    // Group readings by date
    const grouped = readingsToShow.reduce((groups, reading) => {
      const dateKey = new Date(reading.timestamp).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(reading);
      return groups;
    }, {} as { [key: string]: BloodPressureReading[] });
    
    // Sort dates in descending order (most recent first)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(dateKey => ({
        dateKey,
        readings: grouped[dateKey]
      }));
  }, [readings, filteredReadings]);


  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>

          {/* Buttons Skeleton */}
          <div className="mb-6 flex gap-3">
            <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-44 animate-pulse"></div>
          </div>

          {/* Chart Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>

          {/* Readings List Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-5 mb-3">
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to access the blood pressure tracker.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <a 
                  href="/"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Back to Dashboard"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 className="text-4xl font-bold text-gray-900">Blood Pressure Tracker</h1>
              </div>
              <p className="text-gray-600">Monitor your blood pressure readings and track trends</p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-800">
                  Welcome, {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-600">Track your health metrics</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Normal Readings Stats */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-blue-600 mb-2">Normal Readings</h3>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">Last 30 days: {stats.normal.count}</p>
                {stats.normal.count > 0 && (
                  <>
                    <p className="text-sm font-medium text-gray-800">
                      {stats.normal.averageSystolic}/{stats.normal.averageDiastolic} mmHg
                    </p>
                    <span className="text-xs text-gray-500">
                      {getBloodPressureCategory(stats.normal.averageSystolic, stats.normal.averageDiastolic).category}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* After Activity Stats */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-purple-600 mb-2">After Activity</h3>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">Last 30 days: {stats.afterActivity.count}</p>
                {stats.afterActivity.count > 0 && (
                  <>
                    <p className="text-sm font-medium text-gray-800">
                      {stats.afterActivity.averageSystolic}/{stats.afterActivity.averageDiastolic} mmHg
                    </p>
                    <span className="text-xs text-gray-500">
                      {getBloodPressureCategory(stats.afterActivity.averageSystolic, stats.afterActivity.averageDiastolic).category}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            Add New Reading
          </button>
          <button
            onClick={handleExportData}
            className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium shadow-sm"
          >
            Export PDF Report
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full">
              <BloodPressureForm 
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingReading(null);
                }}
                editingReading={editingReading}
              />
            </div>
          </div>
        )}


        {/* Charts Section */}
        {readings.length > 0 && (
          <div className="mb-8">
            <Suspense fallback={
              <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="h-64 bg-gray-100 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            }>
              <BloodPressureCharts 
                readings={readings} 
                stats={stats || { normal: { count: 0, averageSystolic: 0, averageDiastolic: 0 }, afterActivity: { count: 0, averageSystolic: 0, averageDiastolic: 0 } }}
                onFilteredReadingsChange={handleFilteredReadingsChange}
              />
            </Suspense>
          </div>
        )}

        {/* Readings List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Recent Readings ({filteredReadings.length > 0 ? filteredReadings.length : readings.length})
              </h2>
              <div className="flex gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Normal
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  After Activity
                </span>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">Loading readings...</div>
            ) : groupedReadings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No readings found for the selected filters. Try adjusting your time period or reading type.
              </div>
            ) : (
              <div className="space-y-6">
                {groupedReadings.map(({ dateKey, readings: dayReadings }) => {
                    const readingDate = new Date(dayReadings[0].timestamp);
                    const isToday = readingDate.toDateString() === new Date().toDateString();
                    const isYesterday = readingDate.toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
                    
                    // Calculate relative date
                    const getRelativeDate = (date: Date) => {
                      if (isToday) return 'Today';
                      if (isYesterday) return 'Yesterday';
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric',
                        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      });
                    };
                    
                    return (
                      <div key={dateKey} className="space-y-3">
                        {/* Date Header */}
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <div className="px-4 py-2 bg-gray-100 rounded-full">
                            <h3 className="text-sm font-semibold text-gray-700">
                              {getRelativeDate(readingDate)}
                            </h3>
                          </div>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                        
                        {/* Readings for this date */}
                        <div className="space-y-3">
                          {dayReadings.map((reading) => {
                            const category = getBloodPressureCategory(reading.systolic, reading.diastolic);
                            const typeColor = getReadingTypeColor(reading.readingType);
                            const readingTime = new Date(reading.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false 
                            });
                            
                            return (
                              <div key={reading._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                      <span className="text-3xl font-bold text-gray-900">
                                        {formatBloodPressure(reading.systolic, reading.diastolic)}
                                      </span>
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        typeColor === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                      }`}>
                                        {getReadingTypeLabel(reading.readingType)}
                                      </span>
                                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        category.color === 'green' ? 'bg-green-100 text-green-800' :
                                        category.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        category.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {category.category}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-gray-600 font-medium">
                                          {readingTime}
                                        </p>
                                        {reading.notes && (
                                          <p className="text-sm text-gray-600 mt-1 italic">"{reading.notes}"</p>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <button 
                                          onClick={() => handleEditReading(reading)}
                                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors" 
                                          title="Edit reading"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                        <button 
                                          onClick={() => setDeletingReading(reading)}
                                          className="p-2 text-gray-400 hover:text-red-600 transition-colors" 
                                          title="Delete reading"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deletingReading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Reading</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this blood pressure reading? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingReading(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteReading(deletingReading)}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
