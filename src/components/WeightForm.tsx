'use client';

import { useState } from 'react';
import { WeightFormData, WeightReading } from '@/types/weight';

interface WeightFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingReading?: WeightReading | null;
}

export default function WeightForm({ onSuccess, onCancel, editingReading }: WeightFormProps) {
  // Helper function to format date for datetime-local input
  const formatForDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState<WeightFormData>({
    weight: editingReading?.weight || 0,
    timestamp: editingReading ? 
      formatForDateTimeLocal(new Date(editingReading.timestamp)) : 
      formatForDateTimeLocal(new Date()),
    notes: editingReading?.notes || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const isEditing = !!editingReading;
      const url = '/api/weight';
      const method = isEditing ? 'PUT' : 'POST';
      
      if (isEditing && !editingReading._id) {
        throw new Error('Reading ID is missing');
      }
      
      // Add timezone offset to help server parse datetime correctly
      const timezoneOffset = new Date().getTimezoneOffset();
      const body = isEditing 
        ? { id: editingReading._id, ...formData, timezoneOffset }
        : { ...formData, timezoneOffset };

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
      console.log(`Weight reading ${isEditing ? 'updated' : 'saved'}:`, result);
      
      // Reset form only if not editing
      if (!isEditing) {
        setFormData({
          weight: 0,
          timestamp: formatForDateTimeLocal(new Date()),
          notes: ''
        });
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof WeightFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {editingReading ? 'Edit Weight Reading' : 'Add Weight Reading'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Weight Input */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            id="weight"
            value={formData.weight || ''}
            onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 text-gray-900"
            placeholder="70.5"
            min="20"
            max="300"
            step="0.1"
            required
          />
        </div>

        {/* Date & Time Input */}
        <div>
          <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time
          </label>
          <input
            type="datetime-local"
            id="timestamp"
            value={formData.timestamp}
            onChange={(e) => handleInputChange('timestamp', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 text-gray-900"
            required
          />
        </div>

        {/* Notes Input */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 text-gray-900"
            placeholder="Any noteworthy observations..."
            rows={3}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (editingReading ? 'Update Reading' : 'Save Reading')}
          </button>
        </div>
      </form>
    </div>
  );
}
