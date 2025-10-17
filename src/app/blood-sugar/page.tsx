'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BloodSugarForm from '@/components/BloodSugarForm';
import Modal from '@/components/Modal';
import BloodSugarCharts from '@/components/BloodSugarCharts';
import { BloodSugarReading, BloodSugarStats } from '@/types/blood-sugar';
import { getBloodSugarCategory, getReadingTypeLabel, getReadingTypeColor } from '@/lib/blood-sugar-utils';
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
    // Use filtered readings if filters are active, otherwise use all readings
    const readingsToExport = filteredReadings.length > 0 ? filteredReadings : readings;
    
    if (readingsToExport.length === 0) {
      alert('No data to export. Adjust your filters or add readings.');
      return;
    }
    await exportBloodSugarToPDF(readingsToExport);
  };

  // Group readings by date for display
  const groupedReadingsRaw = filteredReadings.reduce((groups: { [key: string]: BloodSugarReading[] }, reading) => {
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

  // Sort dates in ascending order (oldest first) to match charts and PDF
  const groupedReadings = Object.keys(groupedReadingsRaw)
    .sort((a, b) => {
      // Parse the dates back for proper comparison
      const dateA = new Date(groupedReadingsRaw[a][0].timestamp);
      const dateB = new Date(groupedReadingsRaw[b][0].timestamp);
      return dateA.getTime() - dateB.getTime();
    })
    .reduce((sorted: { [key: string]: BloodSugarReading[] }, key) => {
      sorted[key] = groupedReadingsRaw[key];
      return sorted;
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
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
                  <svg className="w-6 h-6 text-green-600 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-1">
                    Blood Sugar
                  </h1>
                  <p className="text-lg text-gray-600">Monitor glucose levels across readings</p>
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
            {/* Average Glucose Stats */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Average Glucose</h3>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-green-100 text-sm">Last 30 days</p>
                {stats.totalReadings > 0 ? (
                  <>
                    <p className="text-4xl font-bold">
                      {stats.averageGlucose} <span className="text-2xl">mg/dL</span>
                    </p>
                    <p className="text-green-100 text-sm">
                      Range: {stats.lowestGlucose} - {stats.highestGlucose} mg/dL
                    </p>
                    <p className="text-green-100 text-sm mt-2">{stats.totalReadings} readings</p>
                  </>
                ) : (
                  <p className="text-2xl font-bold">No readings yet</p>
                )}
              </div>
            </div>

            {/* Readings by Type Stats */}
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Readings by Type</h3>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-teal-50">
                <div className="flex justify-between items-center">
                  <span>Fasting:</span>
                  <span className="font-semibold text-white">{stats.readingsByType.fasting}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Before Meal:</span>
                  <span className="font-semibold text-white">{stats.readingsByType.before_meal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>After Meal:</span>
                  <span className="font-semibold text-white">{stats.readingsByType.after_meal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bedtime:</span>
                  <span className="font-semibold text-white">{stats.readingsByType.bedtime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Random:</span>
                  <span className="font-semibold text-white">{stats.readingsByType.random}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => {
              setEditingReading(null);
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Close Form' : 'Add New Reading'}
          </button>
          {readings.length > 0 && (
            <button
              onClick={handleExportData}
              className="bg-white border-2 border-green-200 text-green-600 px-8 py-3 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all duration-300 font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Export PDF Report
            </button>
          )}
        </div>

        {/* Form Modal */}
        <Modal 
          isOpen={showForm} 
          onClose={() => { setShowForm(false); setEditingReading(null); }}
          title={editingReading ? 'Edit Reading' : 'Add New Reading'}
        >
          <BloodSugarForm onSuccess={handleFormSuccess} editingReading={editingReading} />
        </Modal>

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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
          <div className="p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Recent Readings</h2>
              <p className="text-sm text-gray-600">{Object.keys(groupedReadings).length} days with readings</p>
            </div>
            <div>
            {Object.keys(groupedReadings).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedReadings).map(([date, dateReadings]) => (
                  <div key={date} className="space-y-4">
                    {/* Date Header */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                      <div className="px-5 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200">
                        <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                          {date}
                        </h3>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </div>
                    <div className="space-y-4">
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
                            className="border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300 bg-white hover:-translate-y-0.5"
                          >
                            <div className="flex items-start justify-between">
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

