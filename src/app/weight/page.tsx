'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import WeightForm from '@/components/WeightForm';
import WeightCharts from '@/components/WeightCharts';
import { WeightReading, WeightStats } from '@/types/weight';
import { formatWeight, getWeightChangeColor, getWeightChangeLabel } from '@/lib/weight-utils';
import { exportWeightToPDF } from '@/lib/pdf-export-utils';

export default function WeightPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [readings, setReadings] = useState<WeightReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<WeightReading[]>([]);
  const [stats, setStats] = useState<WeightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReading, setEditingReading] = useState<WeightReading | null>(null);
  const [deletingReading, setDeletingReading] = useState<WeightReading | null>(null);

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
        fetch('/api/weight'),
        fetch('/api/weight/stats')
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
      const response = await fetch('/api/weight');
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
      const response = await fetch('/api/weight/stats');
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

  const handleEditReading = (reading: WeightReading) => {
    setEditingReading(reading);
    setShowForm(true);
  };

  const handleDeleteReading = async (reading: WeightReading) => {
    if (!reading._id) return;

    try {
      const response = await fetch(`/api/weight?id=${reading._id}`, {
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
    await exportWeightToPDF(readings);
  };

  const handleFilteredReadingsChange = useCallback((filtered: WeightReading[]) => {
    setFilteredReadings(filtered);
  }, []);

  // Initialize filtered readings with all readings when readings are first loaded
  useEffect(() => {
    if (readings.length > 0 && filteredReadings.length === 0) {
      setFilteredReadings(readings);
    }
  }, [readings, filteredReadings.length]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your health tracker...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to access the weight tracker.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <a 
                  href="/"
                  className="text-purple-600 hover:text-purple-800 transition-colors"
                  title="Back to Dashboard"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 className="text-4xl font-bold text-gray-900">Weight Tracker</h1>
              </div>
              <p className="text-gray-600">Monitor your weight and track trends</p>
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
            {/* Current Weight Stats */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-purple-600 mb-2">Current Weight</h3>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">Last 30 days: {stats.count}</p>
                {stats.count > 0 && (
                  <>
                    <p className="text-sm font-medium text-gray-800">
                      {formatWeight(stats.averageWeight)} avg
                    </p>
                    <span className="text-xs text-gray-500">
                      Range: {formatWeight(stats.minWeight)} - {formatWeight(stats.maxWeight)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Weight Change Stats */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-purple-600 mb-2">Weight Change</h3>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">30-day change</p>
                {stats.weightChange !== 0 && (
                  <>
                    <p className={`text-sm font-medium ${
                      getWeightChangeColor(stats.weightChange) === 'green' ? 'text-green-600' :
                      getWeightChangeColor(stats.weightChange) === 'red' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {getWeightChangeLabel(stats.weightChange)}
                    </p>
                    <span className="text-xs text-gray-500">
                      {stats.weightChange > 0 ? 'Weight gain' : 'Weight loss'}
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
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
          >
            Add New Reading
          </button>
          <button
            onClick={handleExportData}
            className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium shadow-sm"
          >
            Export PDF Report
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full">
              <WeightForm 
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
            <WeightCharts 
              readings={readings} 
              stats={stats || { count: 0, averageWeight: 0, minWeight: 0, maxWeight: 0, recentReadings: [], weightChange: 0 }}
              onFilteredReadingsChange={handleFilteredReadingsChange}
            />
          </div>
        )}

        {/* Readings List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Recent Readings ({filteredReadings.length > 0 ? filteredReadings.length : readings.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="text-center py-8">Loading readings...</div>
            ) : (filteredReadings.length > 0 ? filteredReadings : readings).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No readings found for the selected filters. Try adjusting your time period.
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const readingsToShow = filteredReadings.length > 0 ? filteredReadings : readings;
                  
                  // Group readings by date
                  const groupedReadings = readingsToShow.reduce((groups, reading) => {
                    const dateKey = new Date(reading.timestamp).toDateString();
                    if (!groups[dateKey]) {
                      groups[dateKey] = [];
                    }
                    groups[dateKey].push(reading);
                    return groups;
                  }, {} as { [key: string]: WeightReading[] });
                  
                  // Sort dates in descending order (most recent first)
                  const sortedDates = Object.keys(groupedReadings).sort((a, b) => 
                    new Date(b).getTime() - new Date(a).getTime()
                  );
                  
                  return sortedDates.map((dateKey) => {
                    const dayReadings = groupedReadings[dateKey];
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
                                        {formatWeight(reading.weight)}
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
                  });
                })()}
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
                Are you sure you want to delete this weight reading? This action cannot be undone.
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
