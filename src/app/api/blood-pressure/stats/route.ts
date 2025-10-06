import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { BloodPressureReading, BloodPressureStats } from '@/types/blood-pressure';
import { calculateAverage, filterReadingsByType } from '@/lib/blood-pressure-utils';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'week', 'month', 'all'

    const db = await getDatabase();
    const collection = db.collection<BloodPressureReading>('blood_pressure');

    // Calculate date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { timestamp: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { timestamp: { $gte: monthAgo } };
    }

    const query = { userId, ...dateFilter };
    const readings = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();

    // Separate readings by type
    const normalReadings = filterReadingsByType(readings, 'normal');
    const afterActivityReadings = filterReadingsByType(readings, 'after_activity');

    // Calculate statistics
    const normalAverage = calculateAverage(normalReadings);
    const afterActivityAverage = calculateAverage(afterActivityReadings);

    const stats: BloodPressureStats = {
      normal: {
        count: normalReadings.length,
        averageSystolic: normalAverage.systolic,
        averageDiastolic: normalAverage.diastolic,
        recentReadings: normalReadings.slice(0, 10)
      },
      afterActivity: {
        count: afterActivityReadings.length,
        averageSystolic: afterActivityAverage.systolic,
        averageDiastolic: afterActivityAverage.diastolic,
        recentReadings: afterActivityReadings.slice(0, 10)
      }
    };

    return NextResponse.json({ stats, period });
  } catch (error) {
    console.error('Error fetching blood pressure stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
