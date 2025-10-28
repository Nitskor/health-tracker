'use client';

import { useState, useEffect } from 'react';
import { BloodSugarReading, ReadingType } from '@/types/blood-sugar';

interface BloodSugarFormProps {
  onSuccess: () => void;
  editingReading?: BloodSugarReading | null;
}

export default function BloodSugarForm({ onSuccess, editingReading }: BloodSugarFormProps) {
  // Helper function to format date for datetime-local input
  const formatForDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [glucose, setGlucose] = useState('');
  const [readingType, setReadingType] = useState<ReadingType>('fasting');
  const [timestamp, setTimestamp] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Set default timestamp to now
    if (!editingReading) {
      setTimestamp(formatForDateTimeLocal(new Date()));
    }
  }, [editingReading]);

  useEffect(() => {
    if (editingReading) {
      setGlucose(editingReading.glucose.toString());
      setReadingType(editingReading.readingType);
      setTimestamp(formatForDateTimeLocal(new Date(editingReading.timestamp)));
      setNotes(editingReading.notes || '');
    }
  }, [editingReading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const glucoseNum = Number(glucose);
      if (isNaN(glucoseNum) || glucoseNum < 20 || glucoseNum > 600) {
        setError('Please enter a valid glucose value between 20 and 600 mg/dL');
        setIsSubmitting(false);
        return;
      }

      const data = {
        glucose: glucoseNum,
        readingType,
        timestamp: new Date(timestamp).toISOString(),
        notes,
      };

      const url = '/api/blood-sugar';
      const method = editingReading ? 'PUT' : 'POST';
      const body = editingReading ? { ...data, _id: editingReading._id } : data;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save reading');
      }

      // Reset form
      if (!editingReading) {
        setGlucose('');
        setReadingType('fasting');
        setTimestamp(formatForDateTimeLocal(new Date()));
        setNotes('');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="glucose" className="block text-sm font-medium text-gray-700 mb-1">
          Glucose Level (mg/dL) *
        </label>
        <input
          type="number"
          id="glucose"
          value={glucose}
          onChange={(e) => setGlucose(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          placeholder="e.g., 95"
          required
          min="20"
          max="600"
        />
        <p className="mt-1 text-sm text-gray-500">Normal range varies by reading type</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reading Type *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="fasting"
              checked={readingType === 'fasting'}
              onChange={(e) => setReadingType(e.target.value as ReadingType)}
              className="mr-2 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-900">Fasting (Target: &lt; 100 mg/dL)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="before_meal"
              checked={readingType === 'before_meal'}
              onChange={(e) => setReadingType(e.target.value as ReadingType)}
              className="mr-2 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-900">Before Meal (Target: &lt; 100 mg/dL)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="after_meal"
              checked={readingType === 'after_meal'}
              onChange={(e) => setReadingType(e.target.value as ReadingType)}
              className="mr-2 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-900">After Meal (Target: &lt; 140 mg/dL)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="bedtime"
              checked={readingType === 'bedtime'}
              onChange={(e) => setReadingType(e.target.value as ReadingType)}
              className="mr-2 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-900">Bedtime (Target: 90-150 mg/dL)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="random"
              checked={readingType === 'random'}
              onChange={(e) => setReadingType(e.target.value as ReadingType)}
              className="mr-2 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-900">Random (Target: &lt; 140 mg/dL)</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-1">
          Date and Time *
        </label>
        <input
          type="datetime-local"
          id="timestamp"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          required
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          rows={3}
          placeholder="e.g., After exercise, Before breakfast..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving...' : editingReading ? 'Update Reading' : 'Add Reading'}
      </button>
    </form>
  );
}

