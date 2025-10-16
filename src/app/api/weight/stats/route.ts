import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { WeightReading, WeightStats } from '@/types/weight';
import { calculateWeightStats } from '@/lib/weight-utils';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days'; // 'week', '30days', 'all'

    const db = await getDatabase();
    const collection = db.collection<WeightReading>('weight_readings');

    // Calculate date filter based on period - default to 30 days
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { timestamp: { $gte: weekAgo } };
    } else if (period === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { timestamp: { $gte: thirtyDaysAgo } };
    } else if (period === 'all') {
      // No date filter for all-time
    }

    const query = { userId, ...dateFilter };
    const readings = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();

    // Calculate statistics
    const stats = calculateWeightStats(readings);

    const weightStats: WeightStats = {
      count: readings.length,
      averageWeight: stats.averageWeight,
      minWeight: stats.minWeight,
      maxWeight: stats.maxWeight,
      recentReadings: readings.slice(0, 10),
      weightChange: stats.weightChange
    };

    return NextResponse.json({ stats: weightStats, period });
  } catch (error) {
    console.error('Error fetching weight stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
