import { WeightReading } from '@/types/weight';

export function calculateWeightStats(readings: WeightReading[]): {
  averageWeight: number;
  minWeight: number;
  maxWeight: number;
  weightChange: number;
} {
  if (readings.length === 0) {
    return { averageWeight: 0, minWeight: 0, maxWeight: 0, weightChange: 0 };
  }

  const weights = readings.map(r => r.weight);
  const averageWeight = Math.round((weights.reduce((sum, w) => sum + w, 0) / weights.length) * 10) / 10;
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  // Calculate weight change from 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentReadings = readings.filter(r => new Date(r.timestamp) >= thirtyDaysAgo);
  const oldReadings = readings.filter(r => new Date(r.timestamp) < thirtyDaysAgo);
  
  let weightChange = 0;
  if (recentReadings.length > 0 && oldReadings.length > 0) {
    const recentAvg = recentReadings.reduce((sum, r) => sum + r.weight, 0) / recentReadings.length;
    const oldAvg = oldReadings.reduce((sum, r) => sum + r.weight, 0) / oldReadings.length;
    weightChange = Math.round((recentAvg - oldAvg) * 10) / 10;
  }

  return { averageWeight, minWeight, maxWeight, weightChange };
}

export function formatWeight(weight: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (unit === 'lbs') {
    const pounds = Math.round(weight * 2.20462 * 10) / 10;
    return `${pounds} lbs`;
  }
  return `${weight} kg`;
}

export function getWeightChangeColor(change: number): string {
  if (change > 0) return 'red'; // Weight gain
  if (change < 0) return 'green'; // Weight loss
  return 'gray'; // No change
}

export function getWeightChangeLabel(change: number): string {
  if (change > 0) return `+${change} kg`;
  if (change < 0) return `${change} kg`;
  return 'No change';
}

export function getWeightCategory(weight: number, height?: number): {
  category: string;
  color: string;
  description: string;
} {
  if (!height) {
    return {
      category: 'Unknown',
      color: 'gray',
      description: 'Height not provided for BMI calculation'
    };
  }

  const bmi = weight / ((height / 100) ** 2);
  
  if (bmi < 18.5) {
    return {
      category: 'Underweight',
      color: 'blue',
      description: 'BMI below 18.5'
    };
  } else if (bmi < 25) {
    return {
      category: 'Normal',
      color: 'green',
      description: 'BMI 18.5-24.9'
    };
  } else if (bmi < 30) {
    return {
      category: 'Overweight',
      color: 'yellow',
      description: 'BMI 25-29.9'
    };
  } else {
    return {
      category: 'Obese',
      color: 'red',
      description: 'BMI 30+'
    };
  }
}
