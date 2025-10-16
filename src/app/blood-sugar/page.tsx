'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import BloodSugarForm from '@/components/BloodSugarForm';
import BloodSugarCharts from '@/components/BloodSugarCharts';
import { BloodSugarReading, BloodSugarStats } from '@/types/blood-sugar';
import { formatGlucose, getBloodSugarCategory, getReadingTypeLabel, getReadingTypeColor } from '@/lib/blood-sugar-utils';
import { exportBloodSugarToPDF } from '@/lib/pdf-export-utils';

export default function BloodSugarPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [readings, setReadings] = useState<BloodSugarReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<BloodSugarReading[]>([]);
  const [stats, setStats] = useState<BloodSugarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReading, setEditingReading] = useState<BloodSugarReading | null>(null);
  const [deletingReading, setDeletingReading] = useState<BloodSugarReading | null>(null);

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
        fetch('/api/blood-sugar'),
        fetch('/api/blood-sugar/stats?period=30days')
      ]);

      if (readingsResponse.ok) {
        const data = await readingsResponse.json();
        setReadings(data.readings);
      }

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async () => {
    try {
      const response = await fetch('/api/blood-sugar');
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
      const response = await fetch('/api/blood-sugar/stats?period=30days');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
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

  const handleFilteredReadingsChange = useCallback((filtered: BloodSugarReading[]) => {
    setFilteredReadings(filtered);
  }, []);

  const handleEditReading = (reading: BloodSugarReading) => {
    setEditingReading(reading);
    setShowForm(true);
  };

  const handleDeleteReading = async (readingId: string) => {
    try {
      const response = await fetch(`/api/blood-sugar?id=${readingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchReadings();
        fetchStats();
        setDeletingReading(null);
      }
    } catch (error) {
      console.error('Error deleting reading:', error);
    }
  };

  const handleExportData = async () => {
    await exportBloodSugarToPDF(readings);
  };

  // Group readings by date for display
  const groupedReadings = filteredReadings.reduce((groups: { [key: string]: BloodSugarReading[] }, reading) => {
    const date = new Date(reading.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(reading);
    return groups;
  }, {});

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <a 
                  href="/"
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="Back to Dashboard"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 className="text-4xl font-bold text-gray-900">Blood Sugar Tracker</h1>
              </div>
              <p className="text-gray-600">Monitor your blood glucose levels and track trends</p>
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
            {/* Average Glucose Stats */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-green-600 mb-2">Average Glucose</h3>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">Last 30 days: {stats.totalReadings} readings</p>
                {stats.totalReadings > 0 && (
                  <>
                    <p className="text-sm font-medium text-gray-800">
                      {stats.averageGlucose} mg/dL
                    </p>
                    <span className="text-xs text-gray-500">
                      Range: {stats.lowestGlucose} - {stats.highestGlucose} mg/dL
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Readings by Type Stats */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-green-600 mb-2">Readings by Type</h3>
              <div className="space-y-1 text-xs text-gray-600">
                <p>Fasting: {stats.readingsByType.fasting}</p>
                <p>Before Meal: {stats.readingsByType.before_meal}</p>
                <p>After Meal: {stats.readingsByType.after_meal}</p>
                <p>Bedtime: {stats.readingsByType.bedtime}</p>
                <p>Random: {stats.readingsByType.random}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              setEditingReading(null);
              setShowForm(!showForm);
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
          >
            {showForm ? 'Close Form' : 'Add New Reading'}
          </button>
          {readings.length > 0 && (
            <button
              onClick={handleExportData}
              className="bg-white border-2 border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium shadow-sm"
            >
              Export PDF Report
            </button>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingReading ? 'Edit Reading' : 'Add New Reading'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingReading(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <BloodSugarForm onSuccess={handleFormSuccess} editingReading={editingReading} />
            </div>
          </div>
        )}

        {/* Charts */}
        {readings.length > 0 && (
          <div className="mb-8">
            <BloodSugarCharts 
              readings={readings}
              onFilteredReadingsChange={handleFilteredReadingsChange}
            />
          </div>
        )}

        {/* Recent Readings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Readings</h2>
          </div>
          <div className="p-6">
            {Object.keys(groupedReadings).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedReadings).map(([date, dateReadings]) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                      {date}
                    </h3>
                    <div className="space-y-3">
                      {dateReadings.map((reading) => {
                        const category = getBloodSugarCategory(reading.glucose, reading.readingType);
                        const time = new Date(reading.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        });

                        return (
                          <div
                            key={reading._id}
                            className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-medium text-gray-500">{time}</span>
                                <span
                                  className="px-2 py-1 text-xs font-medium rounded"
                                  style={{
                                    backgroundColor: getReadingTypeColor(reading.readingType) + '20',
                                    color: getReadingTypeColor(reading.readingType),
                                  }}
                                >
                                  {getReadingTypeLabel(reading.readingType)}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-green-600">
                                  {reading.glucose}
                                </span>
                                <span className="text-sm text-gray-500">mg/dL</span>
                                <span
                                  className={`ml-2 px-2 py-1 text-xs rounded ${
                                    category === 'Normal'
                                      ? 'bg-green-50 text-green-700'
                                      : category === 'Low'
                                      ? 'bg-yellow-50 text-yellow-700'
                                      : category === 'Prediabetes' || category === 'High'
                                      ? 'bg-orange-50 text-orange-700'
                                      : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  {category}
                                </span>
                              </div>
                              {reading.notes && (
                                <p className="text-sm text-gray-600 mt-2">{reading.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditReading(reading)}
                                className="text-green-600 hover:text-green-700 p-2"
                                title="Edit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeletingReading(reading)}
                                className="text-red-600 hover:text-red-700 p-2"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No readings yet. Add your first reading to get started!
              </p>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deletingReading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Reading</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this reading? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDeleteReading(deletingReading._id!)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeletingReading(null)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

