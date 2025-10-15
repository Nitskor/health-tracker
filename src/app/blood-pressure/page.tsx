'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import BloodPressureForm from '@/components/BloodPressureForm';
import BloodPressureCharts from '@/components/BloodPressureCharts';
import { BloodPressureReading, BloodPressureStats } from '@/types/blood-pressure';
import { formatBloodPressure, getBloodPressureCategory, getReadingTypeLabel, getReadingTypeColor } from '@/lib/blood-pressure-utils';

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
      fetchReadings();
      fetchStats();
    }
  }, [isSignedIn]);

  const fetchReadings = async () => {
    try {
      const response = await fetch('/api/blood-pressure');
      if (response.ok) {
        const data = await response.json();
        setReadings(data.readings);
      }
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
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

  const handleFilteredReadingsChange = useCallback((filtered: BloodPressureReading[]) => {
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Blood Pressure Tracker</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Normal Readings Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-blue-600 mb-4">Normal Readings</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Total Readings: {stats.normal.count}</p>
                {stats.normal.count > 0 && (
                  <>
                    <p className="text-sm text-gray-600">
                      Average: {stats.normal.averageSystolic}/{stats.normal.averageDiastolic} mmHg
                    </p>
                    <div className="mt-2">
                      {getBloodPressureCategory(stats.normal.averageSystolic, stats.normal.averageDiastolic).category}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* After Activity Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-purple-600 mb-4">After Activity</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Total Readings: {stats.afterActivity.count}</p>
                {stats.afterActivity.count > 0 && (
                  <>
                    <p className="text-sm text-gray-600">
                      Average: {stats.afterActivity.averageSystolic}/{stats.afterActivity.averageDiastolic} mmHg
                    </p>
                    <div className="mt-2">
                      {getBloodPressureCategory(stats.afterActivity.averageSystolic, stats.afterActivity.averageDiastolic).category}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Reading Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add New Reading
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
            <BloodPressureCharts 
              readings={readings} 
              stats={stats || { normal: { count: 0, averageSystolic: 0, averageDiastolic: 0 }, afterActivity: { count: 0, averageSystolic: 0, averageDiastolic: 0 } }}
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
            ) : (filteredReadings.length > 0 ? filteredReadings : readings).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No readings found for the selected filters. Try adjusting your time period or reading type.
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
                  }, {} as { [key: string]: BloodPressureReading[] });
                  
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
