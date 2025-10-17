'use client';

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BloodPressureForm from '@/components/BloodPressureForm';
import Modal from '@/components/Modal';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center space-x-4 mb-3">
                <Link 
                  href="/"
                  className="group flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  title="Back to Dashboard"
                >
                  <svg className="w-6 h-6 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">
                    Blood Pressure
                  </h1>
                  <p className="text-lg text-gray-600">Track systolic & diastolic readings</p>
                </div>
              </div>
            </div>
            {user && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Welcome back</p>
                <p className="text-xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Normal Readings Stats */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Normal Readings</h3>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-blue-100 text-sm">Last 30 days</p>
                {stats.normal.count > 0 ? (
                  <>
                    <p className="text-4xl font-bold">
                      {stats.normal.averageSystolic}/{stats.normal.averageDiastolic}
                    </p>
                    <p className="text-blue-100">mmHg average</p>
                    <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mt-2 backdrop-blur-sm">
                      {getBloodPressureCategory(stats.normal.averageSystolic, stats.normal.averageDiastolic).category}
                    </div>
                    <p className="text-blue-100 text-sm mt-2">{stats.normal.count} readings</p>
                  </>
                ) : (
                  <p className="text-2xl font-bold">No readings yet</p>
                )}
              </div>
            </div>

            {/* After Activity Stats */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">After Activity</h3>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-purple-100 text-sm">Last 30 days</p>
                {stats.afterActivity.count > 0 ? (
                  <>
                    <p className="text-4xl font-bold">
                      {stats.afterActivity.averageSystolic}/{stats.afterActivity.averageDiastolic}
                    </p>
                    <p className="text-purple-100">mmHg average</p>
                    <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mt-2 backdrop-blur-sm">
                      {getBloodPressureCategory(stats.afterActivity.averageSystolic, stats.afterActivity.averageDiastolic).category}
                    </div>
                    <p className="text-purple-100 text-sm mt-2">{stats.afterActivity.count} readings</p>
                  </>
                ) : (
                  <p className="text-2xl font-bold">No readings yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Reading
          </button>
          <button
            onClick={handleExportData}
            className="bg-white border-2 border-indigo-200 text-indigo-600 px-8 py-3 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Export PDF Report
          </button>
        </div>

        {/* Form Modal */}
        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingReading(null); }}>
          <BloodPressureForm 
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingReading(null);
            }}
            editingReading={editingReading}
          />
        </Modal>


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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Recent Readings
                </h2>
                <p className="text-sm text-gray-600">
                  {filteredReadings.length > 0 ? filteredReadings.length : readings.length} total readings
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-blue-700">Normal</span>
                </span>
                <span className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-purple-700">After Activity</span>
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
                      <div key={dateKey} className="space-y-4">
                        {/* Date Header */}
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                          <div className="px-5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
                            <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                              {getRelativeDate(readingDate)}
                            </h3>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        </div>
                        
                        {/* Readings for this date */}
                        <div className="space-y-4">
                          {dayReadings.map((reading) => {
                            const category = getBloodPressureCategory(reading.systolic, reading.diastolic);
                            const typeColor = getReadingTypeColor(reading.readingType);
                            const readingTime = new Date(reading.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false 
                            });
                            
                            return (
                              <div key={reading._id} className="border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300 bg-white hover:-translate-y-0.5">
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
                                          <p className="text-sm text-gray-600 mt-1 italic">&ldquo;{reading.notes}&rdquo;</p>
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
