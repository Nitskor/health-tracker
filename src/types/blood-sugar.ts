export type ReadingType = 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'random';

export interface BloodSugarReading {
  _id?: string;
  userId: string;
  glucose: number; // mg/dL
  readingType: ReadingType;
  timestamp: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BloodSugarFormData {
  glucose: number;
  readingType: ReadingType;
  timestamp: string;
  notes?: string;
}

export interface BloodSugarStats {
  averageGlucose: number;
  lowestGlucose: number;
  highestGlucose: number;
  totalReadings: number;
  readingsByType: {
    fasting: number;
    before_meal: number;
    after_meal: number;
    bedtime: number;
    random: number;
  };
}

export interface BloodSugarTrend {
  date: string;
  averageGlucose: number;
  readingCount: number;
}

