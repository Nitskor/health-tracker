import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days'; // week, 30days, all-time

    const client = await clientPromise;
    const db = client.db('health-tracker');
    const collection = db.collection('blood_sugar_readings');

    // Calculate date filter
    let dateFilter: Date | null = null;
    if (period === 'week') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === '30days') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 30);
    }

    const query: { userId: string; timestamp?: { $gte: Date } } = { userId };
    if (dateFilter) {
      query.timestamp = { $gte: dateFilter };
    }

    // Fetch readings
    const readings = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();

    // Calculate statistics
    const stats = {
      totalReadings: readings.length,
      averageGlucose: 0,
      lowestGlucose: 0,
      highestGlucose: 0,
      readingsByType: {
        fasting: 0,
        before_meal: 0,
        after_meal: 0,
        bedtime: 0,
        random: 0,
      },
      recentReadings: readings.slice(0, 10),
    };

    if (readings.length > 0) {
      const glucoseValues = readings.map((r) => (r as unknown as { glucose: number }).glucose);
      stats.averageGlucose = Math.round(
        glucoseValues.reduce((sum: number, val: number) => sum + val, 0) / glucoseValues.length
      );
      stats.lowestGlucose = Math.min(...glucoseValues);
      stats.highestGlucose = Math.max(...glucoseValues);

      // Count by type
      readings.forEach((reading) => {
        const typedReading = reading as unknown as { readingType: string };
        if (typedReading.readingType in stats.readingsByType) {
          stats.readingsByType[typedReading.readingType as keyof typeof stats.readingsByType]++;
        }
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching blood sugar stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blood sugar statistics' },
      { status: 500 }
    );
  }
}

