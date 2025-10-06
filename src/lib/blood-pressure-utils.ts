import { BloodPressureReading, ReadingType } from '@/types/blood-pressure';

export function getBloodPressureCategory(systolic: number, diastolic: number): {
  category: string;
  color: string;
  description: string;
} {
  if (systolic < 120 && diastolic < 80) {
    return {
      category: 'Normal',
      color: 'green',
      description: 'Your blood pressure is within the normal range'
    };
  } else if (systolic < 130 && diastolic < 80) {
    return {
      category: 'Elevated',
      color: 'yellow',
      description: 'Your blood pressure is elevated'
    };
  } else {
    return {
      category: 'High',
      color: 'red',
      description: 'Your blood pressure is high'
    };
  }
}

export function calculateAverage(readings: BloodPressureReading[]): {
  systolic: number;
  diastolic: number;
} {
  if (readings.length === 0) {
    return { systolic: 0, diastolic: 0 };
  }

  const totalSystolic = readings.reduce((sum, reading) => sum + reading.systolic, 0);
  const totalDiastolic = readings.reduce((sum, reading) => sum + reading.diastolic, 0);

  return {
    systolic: Math.round(totalSystolic / readings.length),
    diastolic: Math.round(totalDiastolic / readings.length)
  };
}

export function filterReadingsByType(
  readings: BloodPressureReading[], 
  type: ReadingType
): BloodPressureReading[] {
  return readings.filter(reading => reading.readingType === type);
}

export function formatBloodPressure(systolic: number, diastolic: number): string {
  return `${systolic}/${diastolic} mmHg`;
}

export function getReadingTypeLabel(type: ReadingType): string {
  return type === 'normal' ? 'Normal Reading' : 'After Activity';
}

export function getReadingTypeColor(type: ReadingType): string {
  return type === 'normal' ? 'blue' : 'purple';
}
