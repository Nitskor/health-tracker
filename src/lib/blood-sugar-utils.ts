import { BloodSugarReading, ReadingType } from '@/types/blood-sugar';

/**
 * Categorize blood sugar level based on reading type
 * @param glucose - Blood glucose level in mg/dL
 * @param readingType - Type of reading (fasting, before_meal, after_meal, bedtime, random)
 * @returns Category: Normal, Prediabetes, or Diabetes
 */
export function getBloodSugarCategory(glucose: number, readingType: ReadingType): string {
  switch (readingType) {
    case 'fasting':
      if (glucose < 100) return 'Normal';
      if (glucose < 126) return 'Prediabetes';
      return 'Diabetes';
    
    case 'before_meal':
      if (glucose < 100) return 'Normal';
      if (glucose < 126) return 'Prediabetes';
      return 'Diabetes';
    
    case 'after_meal':
      if (glucose < 140) return 'Normal';
      if (glucose < 200) return 'Prediabetes';
      return 'Diabetes';
    
    case 'bedtime':
      if (glucose >= 90 && glucose <= 150) return 'Normal';
      if (glucose < 90) return 'Low';
      return 'High';
    
    case 'random':
      if (glucose < 140) return 'Normal';
      if (glucose < 200) return 'Prediabetes';
      return 'Diabetes';
    
    default:
      return 'Unknown';
  }
}

/**
 * Get color for blood sugar category
 */
export function getCategoryColor(category: string): string {
  switch (category) {
    case 'Normal':
      return 'text-green-600 bg-green-50';
    case 'Low':
      return 'text-yellow-600 bg-yellow-50';
    case 'Prediabetes':
    case 'High':
      return 'text-orange-600 bg-orange-50';
    case 'Diabetes':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Calculate average glucose from readings
 */
export function calculateAverageGlucose(readings: BloodSugarReading[]): number {
  if (readings.length === 0) return 0;
  const sum = readings.reduce((acc, reading) => acc + reading.glucose, 0);
  return Math.round(sum / readings.length);
}

/**
 * Filter readings by type
 */
export function filterReadingsByType(
  readings: BloodSugarReading[],
  type: ReadingType | 'all'
): BloodSugarReading[] {
  if (type === 'all') return readings;
  return readings.filter((reading) => reading.readingType === type);
}

/**
 * Format glucose reading
 */
export function formatGlucose(glucose: number): string {
  return `${glucose} mg/dL`;
}

/**
 * Get reading type label
 */
export function getReadingTypeLabel(type: ReadingType): string {
  const labels: Record<ReadingType, string> = {
    fasting: 'Fasting',
    before_meal: 'Before Meal',
    after_meal: 'After Meal',
    bedtime: 'Bedtime',
    random: 'Random',
  };
  return labels[type];
}

/**
 * Get reading type color (for charts and UI)
 */
export function getReadingTypeColor(type: ReadingType): string {
  const colors: Record<ReadingType, string> = {
    fasting: '#3B82F6', // Blue
    before_meal: '#10B981', // Green
    after_meal: '#F59E0B', // Orange
    bedtime: '#8B5CF6', // Purple
    random: '#EC4899', // Pink
  };
  return colors[type];
}

/**
 * Get target range for reading type
 */
export function getTargetRange(readingType: ReadingType): string {
  switch (readingType) {
    case 'fasting':
    case 'before_meal':
      return '< 100 mg/dL';
    case 'after_meal':
      return '< 140 mg/dL';
    case 'bedtime':
      return '90-150 mg/dL';
    case 'random':
      return '< 140 mg/dL';
    default:
      return 'N/A';
  }
}

