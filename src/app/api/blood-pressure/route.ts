import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { BloodPressureReading, BloodPressureFormData, ReadingType } from '@/types/blood-pressure';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BloodPressureFormData & { timezoneOffset?: number } = await request.json();
    const { systolic, diastolic, bpm, readingType, timestamp, notes, walkDuration, maxBpmDuringWalk, timezoneOffset } = body;

    // Validation
    if (!systolic || !diastolic || !bpm || !readingType || !timestamp) {
      return NextResponse.json({ 
        error: 'Systolic, diastolic, BPM, reading type, and timestamp are required' 
      }, { status: 400 });
    }

    if (systolic < 50 || systolic > 300 || diastolic < 30 || diastolic > 200) {
      return NextResponse.json({ 
        error: 'Invalid blood pressure values' 
      }, { status: 400 });
    }

    if (bpm < 30 || bpm > 220) {
      return NextResponse.json({ 
        error: 'Invalid BPM value (must be between 30-220)' 
      }, { status: 400 });
    }

    if (systolic <= diastolic) {
      return NextResponse.json({ 
        error: 'Systolic must be greater than diastolic' 
      }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<BloodPressureReading>('blood_pressure');

    // Parse datetime-local string using client timezone offset
    const parseLocalDateTime = (dateTimeString: string, timezoneOffsetMinutes?: number): Date => {
      // datetime-local format: "YYYY-MM-DDTHH:MM"
      // This represents the user's local time
      const [datePart, timePart] = dateTimeString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Create date in user's local timezone
      const localDate = new Date(year, month - 1, day, hours, minutes);
      
      // If we have timezone offset, adjust to UTC for storage
      if (timezoneOffsetMinutes !== undefined) {
        // timezoneOffset is in minutes, positive means behind UTC
        // We need to subtract the offset to get UTC time
        const utcTime = localDate.getTime() - (timezoneOffsetMinutes * 60 * 1000);
        return new Date(utcTime);
      }
      
      // Fallback: assume local time (for backward compatibility)
      return localDate;
    };

    const reading: Omit<BloodPressureReading, '_id'> = {
      userId,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      bpm: Number(bpm),
      readingType,
      timestamp: parseLocalDateTime(timestamp, timezoneOffset),
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add optional activity fields only if they exist
    if (readingType === 'after_activity') {
      if (walkDuration) reading.walkDuration = Number(walkDuration);
      if (maxBpmDuringWalk) reading.maxBpmDuringWalk = Number(maxBpmDuringWalk);
    }

    const result = await collection.insertOne(reading);

    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      reading: { ...reading, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error adding blood pressure reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') as 'normal' | 'after_activity' | null;
    const debug = searchParams.get('debug') === 'true';

    const db = await getDatabase();
    const collection = db.collection<BloodPressureReading>('blood_pressure');

    // Build query
    const query: { userId: string; readingType?: ReadingType } = { userId };
    if (type) {
      query.readingType = type as ReadingType;
    }

    const readings = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // If debug mode, return additional info
    if (debug) {
      const totalCount = await collection.countDocuments(query);
      const allReadings = await collection.find(query).sort({ timestamp: 1 }).toArray();
      const dateRange = allReadings.length > 0 ? {
        earliest: allReadings[0].timestamp,
        latest: allReadings[allReadings.length - 1].timestamp
      } : null;
      
      return NextResponse.json({ 
        readings, 
        debug: {
          totalCount,
          returnedCount: readings.length,
          dateRange,
          limit
        }
      });
    }

    return NextResponse.json({ readings });
  } catch (error) {
    console.error('Error fetching blood pressure readings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, systolic, diastolic, bpm, readingType, timestamp, notes, walkDuration, maxBpmDuringWalk, timezoneOffset } = body;
    
    console.log('PUT request received:', { id, userId, body });

    if (!id) {
      return NextResponse.json({ error: 'Reading ID is required' }, { status: 400 });
    }

    // Validation
    if (!systolic || !diastolic || !bpm || !readingType || !timestamp) {
      return NextResponse.json({ 
        error: 'Systolic, diastolic, BPM, reading type, and timestamp are required' 
      }, { status: 400 });
    }

    if (systolic < 50 || systolic > 300 || diastolic < 30 || diastolic > 200) {
      return NextResponse.json({ 
        error: 'Invalid blood pressure values' 
      }, { status: 400 });
    }

    if (bpm < 30 || bpm > 220) {
      return NextResponse.json({ 
        error: 'Invalid BPM value (must be between 30-220)' 
      }, { status: 400 });
    }

    if (systolic <= diastolic) {
      return NextResponse.json({ 
        error: 'Systolic must be greater than diastolic' 
      }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<BloodPressureReading>('blood_pressure');

    // Check if reading exists and belongs to user
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'Invalid reading ID format' }, { status: 400 });
    }
    
    const existingReading = await collection.findOne({ _id: objectId as unknown as string, userId } as Record<string, unknown>);
    if (!existingReading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    // Parse datetime-local string using client timezone offset
    const parseLocalDateTime = (dateTimeString: string, timezoneOffsetMinutes?: number): Date => {
      // datetime-local format: "YYYY-MM-DDTHH:MM"
      // This represents the user's local time
      const [datePart, timePart] = dateTimeString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Create date in user's local timezone
      const localDate = new Date(year, month - 1, day, hours, minutes);
      
      // If we have timezone offset, adjust to UTC for storage
      if (timezoneOffsetMinutes !== undefined) {
        // timezoneOffset is in minutes, positive means behind UTC
        // We need to subtract the offset to get UTC time
        const utcTime = localDate.getTime() - (timezoneOffsetMinutes * 60 * 1000);
        return new Date(utcTime);
      }
      
      // Fallback: assume local time (for backward compatibility)
      return localDate;
    };

    const updateData: Partial<BloodPressureReading> = {
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      bpm: Number(bpm),
      readingType,
      timestamp: parseLocalDateTime(timestamp, timezoneOffset),
      notes: notes || '',
      updatedAt: new Date(),
    };

    // Add or remove activity fields based on reading type
    if (readingType === 'after_activity') {
      if (walkDuration) updateData.walkDuration = Number(walkDuration);
      if (maxBpmDuringWalk) updateData.maxBpmDuringWalk = Number(maxBpmDuringWalk);
    } else {
      // Remove activity fields if changing from after_activity to normal
      updateData.walkDuration = undefined;
      updateData.maxBpmDuringWalk = undefined;
    }

    const result = await collection.updateOne(
      { _id: objectId as unknown as string, userId } as Record<string, unknown>,
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reading updated successfully' 
    });
  } catch (error) {
    console.error('Error updating blood pressure reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Reading ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<BloodPressureReading>('blood_pressure');

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'Invalid reading ID format' }, { status: 400 });
    }
    
    const result = await collection.deleteOne({ _id: objectId as unknown as string, userId } as Record<string, unknown>);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reading deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting blood pressure reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
