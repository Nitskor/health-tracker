export type ReadingType = 'normal' | 'after_activity';

export interface BloodPressureReading {
  _id?: string;
  userId: string;
  systolic: number;
  diastolic: number;
  readingType: ReadingType;
  timestamp: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BloodPressureFormData {
  systolic: number;
  diastolic: number;
  readingType: ReadingType;
  timestamp: string; // ISO string for form handling
  notes?: string;
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
