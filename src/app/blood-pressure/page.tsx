'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import BloodPressureForm from '@/components/BloodPressureForm';
import { BloodPressureReading, BloodPressureStats } from '@/types/blood-pressure';
import { formatBloodPressure, getBloodPressureCategory, getReadingTypeLabel, getReadingTypeColor } from '@/lib/blood-pressure-utils';

export default function BloodPressurePage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [stats, setStats] = useState<BloodPressureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'normal' | 'after_activity'>('all');

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
    fetchReadings();
    fetchStats();
  };

  const filteredReadings = readings.filter(reading => 
    selectedType === 'all' || reading.readingType === selectedType
  );

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return null;
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
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-lg ${
                selectedType === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Readings
            </button>
            <button
              onClick={() => setSelectedType('normal')}
              className={`px-4 py-2 rounded-lg ${
                selectedType === 'normal' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setSelectedType('after_activity')}
              className={`px-4 py-2 rounded-lg ${
                selectedType === 'after_activity' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              After Activity
            </button>
          </div>
        </div>

        {/* Readings List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Recent Readings ({filteredReadings.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-8">Loading readings...</div>
            ) : filteredReadings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No readings found. Add your first blood pressure reading!
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReadings.map((reading) => {
                  const category = getBloodPressureCategory(reading.systolic, reading.diastolic);
                  const typeColor = getReadingTypeColor(reading.readingType);
                  
                  return (
                    <div key={reading._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl font-bold text-gray-800">
                              {formatBloodPressure(reading.systolic, reading.diastolic)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              typeColor === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {getReadingTypeLabel(reading.readingType)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(reading.timestamp).toLocaleString()}
                          </p>
                          {reading.notes && (
                            <p className="text-sm text-gray-500 mt-1">{reading.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            category.color === 'green' ? 'bg-green-100 text-green-800' :
                            category.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            category.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {category.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
