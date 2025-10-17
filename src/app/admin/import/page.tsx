'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

const readings = [
  // Daily normal readings (Aug 18-26, Sept 16-24)
  { date: '2025-08-18', time: '07:45', systolic: 105, diastolic: 65, bpm: 61, readingType: 'normal', notes: '' },
  { date: '2025-08-18', time: '23:30', systolic: 105, diastolic: 59, bpm: 53, readingType: 'normal', notes: '' },
  { date: '2025-08-19', time: '08:00', systolic: 116, diastolic: 64, bpm: 54, readingType: 'normal', notes: '' },
  { date: '2025-08-19', time: '23:30', systolic: 110, diastolic: 64, bpm: 54, readingType: 'normal', notes: '' },
  { date: '2025-08-20', time: '08:00', systolic: 123, diastolic: 70, bpm: 60, readingType: 'normal', notes: '' },
  { date: '2025-08-20', time: '23:45', systolic: 142, diastolic: 78, bpm: 64, readingType: 'normal', notes: '' },
  { date: '2025-08-21', time: '08:00', systolic: 107, diastolic: 65, bpm: 66, readingType: 'normal', notes: '' },
  { date: '2025-08-21', time: '23:10', systolic: 113, diastolic: 69, bpm: 58, readingType: 'normal', notes: '' },
  { date: '2025-08-22', time: '07:45', systolic: 114, diastolic: 69, bpm: 50, readingType: 'normal', notes: '' },
  { date: '2025-08-22', time: '23:30', systolic: 105, diastolic: 55, bpm: 52, readingType: 'normal', notes: '' },
  { date: '2025-08-23', time: '08:30', systolic: 112, diastolic: 69, bpm: 54, readingType: 'normal', notes: '' },
  { date: '2025-08-23', time: '23:15', systolic: 118, diastolic: 69, bpm: 56, readingType: 'normal', notes: '' },
  { date: '2025-08-24', time: '07:15', systolic: 114, diastolic: 62, bpm: 55, readingType: 'normal', notes: '' },
  { date: '2025-08-24', time: '23:20', systolic: 114, diastolic: 67, bpm: 51, readingType: 'normal', notes: '' },
  { date: '2025-08-25', time: '07:15', systolic: 109, diastolic: 66, bpm: 54, readingType: 'normal', notes: '' },
  { date: '2025-08-26', time: '07:15', systolic: null, diastolic: null, bpm: null, readingType: 'normal', notes: '' }, // Missing data
  { date: '2025-09-16', time: '08:15', systolic: 112, diastolic: 66, bpm: 48, readingType: 'normal', notes: '' },
  { date: '2025-09-16', time: '22:45', systolic: 116, diastolic: 75, bpm: 49, readingType: 'normal', notes: '' },
  { date: '2025-09-17', time: '08:30', systolic: 117, diastolic: 75, bpm: 54, readingType: 'normal', notes: '' },
  { date: '2025-09-18', time: '08:15', systolic: 127, diastolic: 70, bpm: 51, readingType: 'normal', notes: '' },
  { date: '2025-09-18', time: '23:00', systolic: 106, diastolic: 68, bpm: 54, readingType: 'normal', notes: '' },
  { date: '2025-09-19', time: '23:30', systolic: 111, diastolic: 69, bpm: 49, readingType: 'normal', notes: '' },
  { date: '2025-09-20', time: '23:15', systolic: 112, diastolic: 71, bpm: 52, readingType: 'normal', notes: '' },
  { date: '2025-09-21', time: '09:30', systolic: 115, diastolic: 75, bpm: 58, readingType: 'normal', notes: '' },
  { date: '2025-09-21', time: '23:00', systolic: 116, diastolic: 69, bpm: 52, readingType: 'normal', notes: '' },
  { date: '2025-09-22', time: '08:00', systolic: 116, diastolic: 75, bpm: 49, readingType: 'normal', notes: '' },
  { date: '2025-09-22', time: '22:30', systolic: 117, diastolic: 68, bpm: 49, readingType: 'normal', notes: '' },
  { date: '2025-09-23', time: '06:30', systolic: 126, diastolic: 73, bpm: 51, readingType: 'normal', notes: '' },
  { date: '2025-09-23', time: '22:45', systolic: 117, diastolic: 66, bpm: 55, readingType: 'normal', notes: '' },
  { date: '2025-09-24', time: '08:15', systolic: 116, diastolic: 73, bpm: 51, readingType: 'normal', notes: '' },

  // After activity readings (Aug 19-25, Sept 16-24)
  { date: '2025-08-19', time: '11:00', systolic: 125, diastolic: 74, bpm: 69, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 80, notes: '' },
  { date: '2025-08-19', time: '19:00', systolic: 123, diastolic: 73, bpm: 71, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 80, notes: '' },
  { date: '2025-08-20', time: '10:45', systolic: 122, diastolic: 73, bpm: 75, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 82, notes: '' },
  { date: '2025-08-20', time: '18:45', systolic: 124, diastolic: 75, bpm: 69, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 83, notes: '' },
  { date: '2025-08-21', time: '10:45', systolic: 102, diastolic: 59, bpm: 55, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 73, notes: '' },
  { date: '2025-08-21', time: '19:00', systolic: 109, diastolic: 65, bpm: 60, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 75, notes: '' },
  { date: '2025-08-22', time: '10:30', systolic: 124, diastolic: 76, bpm: 69, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 82, notes: '' },
  { date: '2025-08-22', time: '18:45', systolic: 128, diastolic: 66, bpm: 65, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 75, notes: '' },
  { date: '2025-08-23', time: '11:15', systolic: 125, diastolic: 77, bpm: 76, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 82, notes: '' },
  { date: '2025-08-23', time: '19:00', systolic: 126, diastolic: 72, bpm: 69, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 81, notes: '' },
  { date: '2025-08-24', time: '11:00', systolic: 117, diastolic: 69, bpm: 72, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 81, notes: '' },
  { date: '2025-08-24', time: '19:00', systolic: 120, diastolic: 55, bpm: 68, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 82, notes: '' },
  { date: '2025-08-25', time: '11:15', systolic: 114, diastolic: 68, bpm: 69, readingType: 'after_activity', walkDuration: 15, maxBpmDuringWalk: 81, notes: '' },
  { date: '2025-09-16', time: '11:15', systolic: 114, diastolic: 75, bpm: 64, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 81, notes: '' },
  { date: '2025-09-16', time: '18:45', systolic: 120, diastolic: 65, bpm: 71, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 85, notes: '' },
  { date: '2025-09-17', time: '11:00', systolic: 117, diastolic: 78, bpm: 69, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 84, notes: '' },
  { date: '2025-09-17', time: '18:45', systolic: 117, diastolic: 66, bpm: 69, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 84, notes: '' },
  { date: '2025-09-18', time: '11:00', systolic: 112, diastolic: 67, bpm: 61, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 80, notes: '' },
  { date: '2025-09-19', time: '19:00', systolic: 116, diastolic: 68, bpm: 68, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 82, notes: '' },
  { date: '2025-09-20', time: '19:00', systolic: 117, diastolic: 67, bpm: 67, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 82, notes: '' },
  { date: '2025-09-21', time: '10:45', systolic: 122, diastolic: 81, bpm: 72, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 85, notes: '' },
  { date: '2025-09-21', time: '19:30', systolic: 126, diastolic: 75, bpm: 64, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 85, notes: '' },
  { date: '2025-09-22', time: '11:00', systolic: 123, diastolic: 75, bpm: 75, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 85, notes: '' },
  { date: '2025-09-23', time: '19:00', systolic: 120, diastolic: 72, bpm: 68, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 85, notes: '' },
  { date: '2025-09-24', time: '11:15', systolic: 124, diastolic: 71, bpm: 64, readingType: 'after_activity', walkDuration: 25, maxBpmDuringWalk: 79, notes: '' },
];

export default function ImportPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ success: 0, failed: 0, deleted: 0 });

  const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setLogs(prev => [...prev, `${icon} ${message}`]);
  };

  const deleteAllData = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL blood pressure data? This cannot be undone!')) {
      return;
    }

    setDeleting(true);
    setLogs([]);
    setStats({ success: 0, failed: 0, deleted: 0 });

    addLog('Fetching all readings to delete...', 'info');
    
    try {
      const response = await fetch('/api/blood-pressure?limit=10000');
      if (!response.ok) {
        throw new Error('Failed to fetch readings');
      }

      const data = await response.json();
      const existingReadings = data.readings || [];
      
      addLog(`Found ${existingReadings.length} readings to delete`, 'info');

      let deletedCount = 0;

      for (const reading of existingReadings) {
        try {
          const deleteResponse = await fetch(`/api/blood-pressure?id=${reading._id}`, {
            method: 'DELETE',
          });

          if (deleteResponse.ok) {
            deletedCount++;
            addLog(`Deleted reading from ${new Date(reading.timestamp).toLocaleDateString()}`, 'success');
          } else {
            const error = await deleteResponse.json();
            addLog(`Failed to delete reading: ${error.error || 'Unknown error'}`, 'error');
          }
        } catch (error) {
          addLog(`Error deleting reading: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setStats(prev => ({ ...prev, deleted: deletedCount }));
      addLog(`Successfully deleted ${deletedCount} readings`, 'success');
      addLog('All data has been cleared! You can now import fresh data.', 'success');
      
    } catch (error) {
      addLog(`Failed to delete data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }

    setDeleting(false);
  };

  const importReadings = async () => {
    setImporting(true);
    setLogs([]);
    setStats({ success: 0, failed: 0, deleted: 0 });
    setProgress(0);

    let successCount = 0;
    let failCount = 0;

    addLog('Starting import of fresh data...', 'info');

    for (let i = 0; i < readings.length; i++) {
      const reading = readings[i];
      
      // Skip entries with null values
      if (!reading.systolic || !reading.diastolic || !reading.bpm) {
        addLog(`${reading.date} ${reading.time} - Skipped (missing data)`, 'info');
        setProgress(i + 1);
        continue;
      }
      
      try {
        const timestamp = `${reading.date}T${reading.time}`;
        
        const response = await fetch('/api/blood-pressure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systolic: reading.systolic,
            diastolic: reading.diastolic,
            bpm: reading.bpm,
            readingType: reading.readingType,
            timestamp: timestamp,
            notes: reading.notes,
            walkDuration: reading.walkDuration,
            maxBpmDuringWalk: reading.maxBpmDuringWalk
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to import');
        }

        successCount++;
        addLog(`${reading.date} ${reading.time} - ${reading.systolic}/${reading.diastolic} (${reading.readingType})`, 'success');
      } catch (error) {
        failCount++;
        addLog(`${reading.date} ${reading.time} - ${error instanceof Error ? error.message : 'Failed'}`, 'error');
      }

      setProgress(i + 1);
      setStats({ success: successCount, failed: failCount, deleted: 0 });

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setImporting(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to import data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            📊 Import Blood Pressure Data
          </h1>
          <p className="text-gray-600 mb-6">Delete old data and import fresh blood pressure readings</p>

          {/* User Info */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Managing data for:</p>
            <p className="text-lg font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </p>
          </div>

          {/* Data Summary */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">📋 Fresh Data Summary:</h2>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• 29 Normal readings (Aug 18-26, Sept 16-24)</li>
              <li>• 25 After Activity readings (post-walk measurements)</li>
              <li>• Walk duration: 15 mins (Aug), 25 mins (Sept)</li>
              <li>• Includes: BP, BPM, walk duration, peak BPM</li>
            </ul>
          </div>

          {/* Action Buttons */}
          {!importing && !deleting && progress === 0 && (
            <div className="space-y-3">
              <button
                onClick={deleteAllData}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-4 px-6 rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                🗑️ Delete All Existing Data
              </button>
              <button
                onClick={importReadings}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                ⬆️ Import Fresh Data
              </button>
              <p className="text-xs text-center text-gray-500 italic">
                Tip: Delete old data first, then import fresh data
              </p>
            </div>
          )}

          {/* Progress */}
          {(importing || deleting || progress > 0 || stats.deleted > 0) && (
            <div className="space-y-4">
              {importing && (
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {progress}/{readings.length}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(progress / readings.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {deleting && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    🗑️ Deleting data...
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                  <div className="text-sm text-green-700">Imported</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.deleted}</div>
                  <div className="text-sm text-orange-700">Deleted</div>
                </div>
              </div>

              {/* Logs */}
              <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <div className="space-y-1 text-sm font-mono">
                  {logs.map((log, i) => (
                    <div key={i} className="text-gray-700">{log}</div>
                  ))}
                </div>
              </div>

              {/* Complete */}
              {!importing && progress === readings.length && (
                <div className="space-y-4">
                  {stats.failed === 0 ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                      <div className="text-4xl mb-2">🎉</div>
                      <h3 className="text-xl font-bold text-green-900 mb-2">Import Complete!</h3>
                      <p className="text-green-700 mb-4">Successfully imported all {stats.success} readings</p>
                      <a
                        href="/blood-pressure"
                        className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        View Blood Pressure Tracker →
                      </a>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                      <h3 className="text-xl font-bold text-yellow-900 mb-2">Import Finished</h3>
                      <p className="text-yellow-700 mb-4">
                        Success: {stats.success} | Failed: {stats.failed}
                      </p>
                      {stats.success > 0 && (
                        <a
                          href="/blood-pressure"
                          className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                        >
                          View Imported Readings →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

