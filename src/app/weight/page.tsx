'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WeightForm from '@/components/WeightForm';
import Modal from '@/components/Modal';
import WeightCharts from '@/components/WeightCharts';
import { WeightReading, WeightStats } from '@/types/weight';
import { formatWeight, getWeightChangeLabel } from '@/lib/weight-utils';
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
    // Use filtered readings if filters are active, otherwise use all readings
    const readingsToExport = filteredReadings.length > 0 ? filteredReadings : readings;
    
    if (readingsToExport.length === 0) {
      alert('No data to export. Adjust your filters or add readings.');
      return;
    }
    await exportWeightToPDF(readingsToExport);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 py-8">
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
                  <svg className="w-6 h-6 text-purple-600 group-hover:text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-1">
                    Weight Tracker
                  </h1>
                  <p className="text-lg text-gray-600">Monitor weight trends over time</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Current Weight Stats */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-bold">Average Weight</h3>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <p className="text-purple-100 text-xs md:text-sm">Last 30 days</p>
                {stats.count > 0 ? (
                  <>
                    <p className="text-2xl md:text-4xl font-bold">
                      {formatWeight(stats.averageWeight)}
                    </p>
                    <p className="text-purple-100 text-xs md:text-sm">
                      Range: {formatWeight(stats.minWeight)} - {formatWeight(stats.maxWeight)}
                    </p>
                    <p className="text-purple-100 text-xs md:text-sm mt-1 md:mt-2">{stats.count} readings</p>
                  </>
                ) : (
                  <p className="text-xl md:text-2xl font-bold">No readings yet</p>
                )}
              </div>
            </div>

            {/* Weight Change Stats */}
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-bold">30-Day Change</h3>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <p className="text-pink-100 text-xs md:text-sm">Weight trend</p>
                {stats.count > 0 && stats.weightChange !== 0 ? (
                  <>
                    <p className="text-2xl md:text-4xl font-bold">
                      {getWeightChangeLabel(stats.weightChange)}
                    </p>
                    <div className="inline-block px-2 md:px-3 py-1 bg-white/20 rounded-full text-xs md:text-sm font-medium mt-1 md:mt-2 backdrop-blur-sm">
                      {stats.weightChange > 0 ? '↑ Weight gain' : '↓ Weight loss'}
                    </div>
                  </>
                ) : (
                  <p className="text-xl md:text-2xl font-bold">No change yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Reading
          </button>
          <button
            onClick={handleExportData}
            className="bg-white border-2 border-purple-200 text-purple-600 px-6 sm:px-8 py-3 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Export PDF Report
          </button>
        </div>

        {/* Form Modal */}
        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingReading(null); }}>
          <WeightForm 
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
          <div className="mb-4 md:mb-8 -mx-4 sm:mx-0">
            <WeightCharts 
              readings={readings} 
              stats={stats || { count: 0, averageWeight: 0, minWeight: 0, maxWeight: 0, recentReadings: [], weightChange: 0 }}
              onFilteredReadingsChange={handleFilteredReadingsChange}
            />
          </div>
        )}

        {/* Readings List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-none sm:rounded-xl md:rounded-2xl shadow-xl border-y sm:border border-gray-100 -mx-4 sm:mx-0">
          <div className="p-3 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4 mb-4 md:mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  Recent Readings
                </h2>
                <p className="text-xs md:text-sm text-gray-600">
                  {filteredReadings.length > 0 ? filteredReadings.length : readings.length} total readings
                </p>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">Loading readings...</div>
            ) : (filteredReadings.length > 0 ? filteredReadings : readings).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No readings found for the selected filters. Try adjusting your time period.
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
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
                  
                  // Sort dates in ascending order (oldest first) to match charts
                  const sortedDates = Object.keys(groupedReadings).sort((a, b) => 
                    new Date(a).getTime() - new Date(b).getTime()
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
                      <div key={dateKey} className="space-y-4">
                        {/* Date Header */}
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                          <div className="px-5 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full border border-purple-200">
                            <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                              {getRelativeDate(readingDate)}
                            </h3>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        </div>
                        
                        {/* Readings for this date */}
                        <div className="space-y-4">
                          {dayReadings.map((reading) => {
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
                                        {formatWeight(reading.weight)}
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
