'use client';

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BloodPressureForm from '@/components/BloodPressureForm';
import Modal from '@/components/Modal';
import { BloodPressureReading, BloodPressureStats } from '@/types/blood-pressure';
import { getBloodPressureCategory } from '@/lib/blood-pressure-utils';
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
        fetch('/api/blood-pressure?limit=10000'),
        fetch('/api/blood-pressure/stats')
      ]);

      if (readingsResponse.ok) {
        const data = await readingsResponse.json();
        console.log('📊 Fetched readings:', data.readings.length, 'total');
        console.log('📅 Date range:', 
          data.readings.length > 0 ? new Date(data.readings[data.readings.length - 1].timestamp).toLocaleDateString() : 'N/A',
          'to',
          data.readings.length > 0 ? new Date(data.readings[0].timestamp).toLocaleDateString() : 'N/A'
        );
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
      // Fetch ALL readings without limit
      const response = await fetch('/api/blood-pressure?limit=10000');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Fetched readings:', data.readings.length, 'total');
        console.log('📅 Date range:', 
          data.readings.length > 0 ? new Date(data.readings[data.readings.length - 1].timestamp).toLocaleDateString() : 'N/A',
          'to',
          data.readings.length > 0 ? new Date(data.readings[0].timestamp).toLocaleDateString() : 'N/A'
        );
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
    // Use filtered readings if filters are active, otherwise use all readings
    const readingsToExport = filteredReadings.length > 0 ? filteredReadings : readings;
    
    if (readingsToExport.length === 0) {
      alert('No data to export. Adjust your filters or add readings.');
      return;
    }
    await exportBloodPressureToPDF(readingsToExport);
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
    
    // Sort dates in ascending order (oldest first) to match charts
    return Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Normal Readings Stats */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-bold">Normal Readings</h3>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <p className="text-blue-100 text-xs md:text-sm">Last 30 days</p>
                {stats.normal.count > 0 ? (
                  <>
                    <p className="text-2xl md:text-4xl font-bold">
                      {stats.normal.averageSystolic}/{stats.normal.averageDiastolic}
                    </p>
                    <p className="text-blue-100 text-sm md:text-base">mmHg average</p>
                    <div className="inline-block px-2 md:px-3 py-1 bg-white/20 rounded-full text-xs md:text-sm font-medium mt-1 md:mt-2 backdrop-blur-sm">
                      {getBloodPressureCategory(stats.normal.averageSystolic, stats.normal.averageDiastolic).category}
                    </div>
                    <p className="text-blue-100 text-xs md:text-sm mt-1 md:mt-2">{stats.normal.count} readings</p>
                  </>
                ) : (
                  <p className="text-xl md:text-2xl font-bold">No readings yet</p>
                )}
              </div>
            </div>

            {/* After Activity Stats */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-bold">After Activity</h3>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <p className="text-purple-100 text-xs md:text-sm">Last 30 days</p>
                {stats.afterActivity.count > 0 ? (
                  <>
                    <p className="text-2xl md:text-4xl font-bold">
                      {stats.afterActivity.averageSystolic}/{stats.afterActivity.averageDiastolic}
                    </p>
                    <p className="text-purple-100 text-sm md:text-base">mmHg average</p>
                    <div className="inline-block px-2 md:px-3 py-1 bg-white/20 rounded-full text-xs md:text-sm font-medium mt-1 md:mt-2 backdrop-blur-sm">
                      {getBloodPressureCategory(stats.afterActivity.averageSystolic, stats.afterActivity.averageDiastolic).category}
                    </div>
                    <p className="text-purple-100 text-xs md:text-sm mt-1 md:mt-2">{stats.afterActivity.count} readings</p>
                  </>
                ) : (
                  <p className="text-xl md:text-2xl font-bold">No readings yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Reading
          </button>
          <button
            onClick={handleExportData}
            className="bg-white border-2 border-indigo-200 text-indigo-600 px-6 sm:px-8 py-3 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
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
          <div className="mb-4 md:mb-8 -mx-4 sm:mx-0">
            <Suspense fallback={
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6 animate-pulse">
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
              <div className="flex gap-2 md:gap-3 text-xs md:text-sm">
                <span className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-blue-700">Normal</span>
                </span>
                <span className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-purple-500 rounded-full"></div>
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
                {/* Normal Readings Table */}
                <div>
                  <div className="mb-3 md:mb-4 flex items-center justify-between">
                    <h4 className="text-base md:text-lg font-bold text-blue-600 flex items-center gap-2">
                      <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full"></div>
                      Normal Readings
                    </h4>
                    <span className="text-xs md:text-sm text-gray-500">
                      {groupedReadings.flatMap(g => g.readings).filter(r => r.readingType === 'normal').length} readings
                    </span>
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Time</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">BP</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">BPM</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Notes</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedReadings.flatMap(({ readings }) => 
                          readings.filter(r => r.readingType === 'normal')
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500">
                              No normal readings in this period
                            </td>
                          </tr>
                        ) : (
                          groupedReadings.flatMap(({ readings }) => 
                            readings.filter(r => r.readingType === 'normal')
                          ).map((reading) => {
                            const category = getBloodPressureCategory(reading.systolic, reading.diastolic);
                            const readingDate = new Date(reading.timestamp).toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric'
                            });
                            const readingTime = new Date(reading.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false 
                            });
                            
                            return (
                              <tr 
                                key={reading._id} 
                                className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                              >
                                <td className="p-3 text-gray-900 font-medium text-sm">{readingDate}</td>
                                <td className="p-3 text-gray-700 text-sm">{readingTime}</td>
                                <td className="p-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-bold text-gray-900">{reading.systolic}/{reading.diastolic}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium w-fit ${
                                      category.color === 'green' ? 'bg-green-100 text-green-700' :
                                      category.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                      category.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {category.category}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-gray-900 font-medium">{reading.bpm}</td>
                                <td className="p-3 text-gray-600 text-sm max-w-[150px] truncate" title={reading.notes}>
                                  {reading.notes || '-'}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button 
                                      onClick={() => handleEditReading(reading)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" 
                                      title="Edit"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => setDeletingReading(reading)}
                                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" 
                                      title="Delete"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {groupedReadings.flatMap(({ readings }) => 
                      readings.filter(r => r.readingType === 'normal')
                    ).length === 0 ? (
                      <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-xl">
                        No normal readings in this period
                      </div>
                    ) : (
                      groupedReadings.flatMap(({ readings }) => 
                        readings.filter(r => r.readingType === 'normal')
                      ).map((reading) => {
                        const category = getBloodPressureCategory(reading.systolic, reading.diastolic);
                        const readingDate = new Date(reading.timestamp).toLocaleDateString('en-US', { 
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        const readingTime = new Date(reading.timestamp).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        });
                        
                        return (
                          <div 
                            key={reading._id} 
                            className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="text-sm font-medium text-gray-500">{readingDate}</div>
                                <div className="text-xs text-gray-400">{readingTime}</div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                category.color === 'green' ? 'bg-green-100 text-green-700' :
                                category.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                category.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {category.category}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Blood Pressure</div>
                                <div className="text-2xl font-bold text-gray-900">{reading.systolic}/{reading.diastolic}</div>
                                <div className="text-xs text-gray-500">mmHg</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Heart Rate</div>
                                <div className="text-2xl font-bold text-gray-900">{reading.bpm}</div>
                                <div className="text-xs text-gray-500">BPM</div>
                              </div>
                            </div>
                            {reading.notes && (
                              <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                {reading.notes}
                              </div>
                            )}
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                              <button 
                                onClick={() => handleEditReading(reading)}
                                className="flex-1 py-2 px-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => setDeletingReading(reading)}
                                className="flex-1 py-2 px-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* After Activity Readings Table */}
                <div>
                  <div className="mb-3 md:mb-4 flex items-center justify-between">
                    <h4 className="text-base md:text-lg font-bold text-purple-600 flex items-center gap-2">
                      <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-500 rounded-full"></div>
                      After Activity Readings
                    </h4>
                    <span className="text-xs md:text-sm text-gray-500">
                      {groupedReadings.flatMap(g => g.readings).filter(r => r.readingType === 'after_activity').length} readings
                    </span>
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Time</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">BP</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">BPM</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Walk</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Peak</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Notes</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedReadings.flatMap(({ readings }) => 
                          readings.filter(r => r.readingType === 'after_activity')
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-500">
                              No after-activity readings in this period
                            </td>
                          </tr>
                        ) : (
                          groupedReadings.flatMap(({ readings }) => 
                            readings.filter(r => r.readingType === 'after_activity')
                          ).map((reading) => {
                            const category = getBloodPressureCategory(reading.systolic, reading.diastolic);
                            const readingDate = new Date(reading.timestamp).toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric'
                            });
                            const readingTime = new Date(reading.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false 
                            });
                            
                            return (
                              <tr 
                                key={reading._id} 
                                className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors"
                              >
                                <td className="p-3 text-gray-900 font-medium text-sm">{readingDate}</td>
                                <td className="p-3 text-gray-700 text-sm">{readingTime}</td>
                                <td className="p-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-bold text-gray-900">{reading.systolic}/{reading.diastolic}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium w-fit ${
                                      category.color === 'green' ? 'bg-green-100 text-green-700' :
                                      category.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                      category.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {category.category}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-gray-900 font-medium">{reading.bpm}</td>
                                <td className="p-3 text-gray-700 text-sm">
                                  {reading.walkDuration ? `${reading.walkDuration}m` : '-'}
                                </td>
                                <td className="p-3 text-purple-700 font-medium text-sm">
                                  {reading.maxBpmDuringWalk || '-'}
                                </td>
                                <td className="p-3 text-gray-600 text-sm max-w-[120px] truncate" title={reading.notes}>
                                  {reading.notes || '-'}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button 
                                      onClick={() => handleEditReading(reading)}
                                      className="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors" 
                                      title="Edit"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => setDeletingReading(reading)}
                                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" 
                                      title="Delete"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {groupedReadings.flatMap(({ readings }) => 
                      readings.filter(r => r.readingType === 'after_activity')
                    ).length === 0 ? (
                      <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-xl">
                        No after activity readings in this period
                      </div>
                    ) : (
                      groupedReadings.flatMap(({ readings }) => 
                        readings.filter(r => r.readingType === 'after_activity')
                      ).map((reading) => {
                        const category = getBloodPressureCategory(reading.systolic, reading.diastolic);
                        const readingDate = new Date(reading.timestamp).toLocaleDateString('en-US', { 
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        const readingTime = new Date(reading.timestamp).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        });
                        
                        return (
                          <div 
                            key={reading._id} 
                            className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="text-sm font-medium text-gray-500">{readingDate}</div>
                                <div className="text-xs text-gray-400">{readingTime}</div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                category.color === 'green' ? 'bg-green-100 text-green-700' :
                                category.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                category.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {category.category}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Blood Pressure</div>
                                <div className="text-xl font-bold text-gray-900">{reading.systolic}/{reading.diastolic}</div>
                                <div className="text-xs text-gray-500">mmHg</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Heart Rate</div>
                                <div className="text-xl font-bold text-gray-900">{reading.bpm}</div>
                                <div className="text-xs text-gray-500">BPM</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3 p-2 bg-purple-50 rounded">
                              <div>
                                <div className="text-xs text-purple-600 mb-1">Walk Duration</div>
                                <div className="text-sm font-bold text-purple-900">
                                  {reading.walkDuration ? `${reading.walkDuration} min` : '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-purple-600 mb-1">Peak BPM</div>
                                <div className="text-sm font-bold text-purple-900">
                                  {reading.maxBpmDuringWalk || '-'}
                                </div>
                              </div>
                            </div>
                            {reading.notes && (
                              <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                {reading.notes}
                              </div>
                            )}
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                              <button 
                                onClick={() => handleEditReading(reading)}
                                className="flex-1 py-2 px-3 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors font-medium text-sm"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => setDeletingReading(reading)}
                                className="flex-1 py-2 px-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
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
