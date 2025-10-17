'use client';

import { useState } from 'react';
import { BloodPressureFormData, ReadingType, BloodPressureReading } from '@/types/blood-pressure';

interface BloodPressureFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingReading?: BloodPressureReading | null;
}

export default function BloodPressureForm({ onSuccess, onCancel, editingReading }: BloodPressureFormProps) {
  const [formData, setFormData] = useState<BloodPressureFormData>({
    systolic: editingReading?.systolic || 0,
    diastolic: editingReading?.diastolic || 0,
    bpm: editingReading?.bpm || 0,
    readingType: editingReading?.readingType || 'normal',
    timestamp: editingReading ? 
      new Date(editingReading.timestamp).toLocaleString('sv-SE').slice(0, 16) : 
      new Date().toLocaleString('sv-SE').slice(0, 16),
    notes: editingReading?.notes || '',
    walkDuration: editingReading?.walkDuration || undefined,
    maxBpmDuringWalk: editingReading?.maxBpmDuringWalk || undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const isEditing = !!editingReading;
      const url = '/api/blood-pressure';
      const method = isEditing ? 'PUT' : 'POST';
      
      if (isEditing && !editingReading._id) {
        throw new Error('Reading ID is missing');
      }
      
      const body = isEditing 
        ? { id: editingReading._id, ...formData }
        : formData;

      console.log('Submitting form:', { isEditing, body, editingReading });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'save'} reading`);
      }

      const result = await response.json();
      console.log(`Blood pressure reading ${isEditing ? 'updated' : 'saved'}:`, result);
      
      // Reset form only if not editing
      if (!isEditing) {
        setFormData({
          systolic: 0,
          diastolic: 0,
          bpm: 0,
          readingType: 'normal',
          timestamp: new Date().toLocaleString('sv-SE').slice(0, 16),
          notes: '',
          walkDuration: undefined,
          maxBpmDuringWalk: undefined
        });
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BloodPressureFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {editingReading ? 'Edit Blood Pressure Reading' : 'Add Blood Pressure Reading'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Systolic Input */}
        <div>
          <label htmlFor="systolic" className="block text-sm font-medium text-gray-700 mb-1">
            Systolic (Top Number)
          </label>
          <input
            type="number"
            id="systolic"
            value={formData.systolic || ''}
            onChange={(e) => handleInputChange('systolic', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
            placeholder="120"
            min="50"
            max="300"
            required
          />
        </div>

        {/* Diastolic Input */}
        <div>
          <label htmlFor="diastolic" className="block text-sm font-medium text-gray-700 mb-1">
            Diastolic (Bottom Number)
          </label>
          <input
            type="number"
            id="diastolic"
            value={formData.diastolic || ''}
            onChange={(e) => handleInputChange('diastolic', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
            placeholder="80"
            min="30"
            max="200"
            required
          />
        </div>

        {/* BPM (Heart Rate) Input */}
        <div>
          <label htmlFor="bpm" className="block text-sm font-medium text-gray-700 mb-1">
            BPM (Heart Rate)
          </label>
          <input
            type="number"
            id="bpm"
            value={formData.bpm || ''}
            onChange={(e) => handleInputChange('bpm', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
            placeholder="70"
            min="30"
            max="220"
            required
          />
        </div>

        {/* Reading Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reading Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="readingType"
                value="normal"
                checked={formData.readingType === 'normal'}
                onChange={(e) => handleInputChange('readingType', e.target.value as ReadingType)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900 font-medium">Normal Reading</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="readingType"
                value="after_activity"
                checked={formData.readingType === 'after_activity'}
                onChange={(e) => handleInputChange('readingType', e.target.value as ReadingType)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900 font-medium">After Activity</span>
            </label>
          </div>
        </div>

        {/* Conditional Activity Fields - Only for After Activity readings */}
        {formData.readingType === 'after_activity' && (
          <>
            <div>
              <label htmlFor="walkDuration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration of Walk (minutes)
              </label>
              <input
                type="number"
                id="walkDuration"
                value={formData.walkDuration || ''}
                onChange={(e) => handleInputChange('walkDuration', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50 text-gray-900"
                placeholder="15"
                min="1"
                max="300"
              />
            </div>

            <div>
              <label htmlFor="maxBpmDuringWalk" className="block text-sm font-medium text-gray-700 mb-1">
                Max BPM During Walk
              </label>
              <input
                type="number"
                id="maxBpmDuringWalk"
                value={formData.maxBpmDuringWalk || ''}
                onChange={(e) => handleInputChange('maxBpmDuringWalk', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50 text-gray-900"
                placeholder="80"
                min="30"
                max="220"
              />
            </div>
          </>
        )}

        {/* Date/Time */}
        <div>
          <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time
          </label>
          <input
            type="datetime-local"
            id="timestamp"
            value={formData.timestamp}
            onChange={(e) => handleInputChange('timestamp', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
            rows={3}
            placeholder="Any noteworthy observations..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Reading'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
