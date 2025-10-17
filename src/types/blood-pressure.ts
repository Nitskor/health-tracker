export type ReadingType = 'normal' | 'after_activity';

export interface BloodPressureReading {
  _id?: string;
  userId: string;
  systolic: number;
  diastolic: number;
  bpm: number; // Heart rate (beats per minute)
  readingType: ReadingType;
  timestamp: Date;
  notes?: string;
  // Activity-specific fields (only for after_activity readings)
  walkDuration?: number; // Duration in minutes
  maxBpmDuringWalk?: number; // Peak heart rate during activity
  createdAt: Date;
  updatedAt: Date;
}

export interface BloodPressureFormData {
  systolic: number;
  diastolic: number;
  bpm: number; // Heart rate (beats per minute)
  readingType: ReadingType;
  timestamp: string; // ISO string for form handling
  notes?: string;
  // Activity-specific fields (only for after_activity readings)
  walkDuration?: number; // Duration in minutes
  maxBpmDuringWalk?: number; // Peak heart rate during activity
}

export interface BloodPressureStats {
  normal: {
    count: number;
    averageSystolic: number;
    averageDiastolic: number;
    recentReadings: BloodPressureReading[];
  };
  afterActivity: {
    count: number;
    averageSystolic: number;
    averageDiastolic: number;
    recentReadings: BloodPressureReading[];
  };
}

export interface BloodPressureTrend {
  date: string;
  normal: {
    systolic: number;
    diastolic: number;
  } | null;
  afterActivity: {
    systolic: number;
    diastolic: number;
  } | null;
}
