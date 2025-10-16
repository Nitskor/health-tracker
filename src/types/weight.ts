export interface WeightReading {
  _id?: string;
  userId: string;
  weight: number; // in kg
  timestamp: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightFormData {
  weight: number;
  timestamp: string; // ISO string for form handling
  notes?: string;
}

export interface WeightStats {
  count: number;
  averageWeight: number;
  minWeight: number;
  maxWeight: number;
  recentReadings: WeightReading[];
  weightChange: number; // change from 30 days ago
}

export interface WeightTrend {
  date: string;
  weight: number;
}
