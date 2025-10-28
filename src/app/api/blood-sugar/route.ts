import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - Retrieve all blood sugar readings for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('health-tracker');
    const collection = db.collection('blood_sugar_readings');

    const readings = await collection
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({ readings });
  } catch (error) {
    console.error('Error fetching blood sugar readings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blood sugar readings' },
      { status: 500 }
    );
  }
}

// POST - Add a new blood sugar reading
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { glucose, readingType, timestamp, notes, timezoneOffset } = body;

    // Validation
    if (!glucose || !readingType || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (glucose < 20 || glucose > 600) {
      return NextResponse.json(
        { error: 'Glucose value must be between 20 and 600 mg/dL' },
        { status: 400 }
      );
    }

    const validReadingTypes = ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random'];
    if (!validReadingTypes.includes(readingType)) {
      return NextResponse.json(
        { error: 'Invalid reading type' },
        { status: 400 }
      );
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

    const client = await clientPromise;
    const db = client.db('health-tracker');
    const collection = db.collection('blood_sugar_readings');

    const newReading = {
      userId,
      glucose: Number(glucose),
      readingType,
      timestamp: parseLocalDateTime(timestamp, timezoneOffset),
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newReading);

    return NextResponse.json(
      { 
        message: 'Blood sugar reading added successfully',
        reading: { ...newReading, _id: result.insertedId }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding blood sugar reading:', error);
    return NextResponse.json(
      { error: 'Failed to add blood sugar reading' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing blood sugar reading
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { _id, glucose, readingType, timestamp, notes, timezoneOffset } = body;

    if (!_id) {
      return NextResponse.json(
        { error: 'Reading ID is required' },
        { status: 400 }
      );
    }

    // Validation
    if (glucose && (glucose < 20 || glucose > 600)) {
      return NextResponse.json(
        { error: 'Glucose value must be between 20 and 600 mg/dL' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('health-tracker');
    const collection = db.collection('blood_sugar_readings');

    let objectId;
    try {
      objectId = new ObjectId(_id);
    } catch {
      console.error('Invalid ObjectId format:', _id);
      return NextResponse.json(
        { error: 'Invalid reading ID format' },
        { status: 400 }
      );
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

    const updateData: Record<string, Date | number | string> = {
      updatedAt: new Date(),
    };

    if (glucose !== undefined) updateData.glucose = Number(glucose);
    if (readingType) updateData.readingType = readingType;
    if (timestamp) updateData.timestamp = parseLocalDateTime(timestamp, timezoneOffset);
    if (notes !== undefined) updateData.notes = notes;

    const result = await collection.updateOne(
      { _id: objectId, userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Reading not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Reading updated successfully' });
  } catch (error) {
    console.error('Error updating blood sugar reading:', error);
    return NextResponse.json(
      { error: 'Failed to update blood sugar reading' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a blood sugar reading
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Reading ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('health-tracker');
    const collection = db.collection('blood_sugar_readings');

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error('Invalid ObjectId format:', id, error);
      return NextResponse.json(
        { error: 'Invalid reading ID format' },
        { status: 400 }
      );
    }

    const result = await collection.deleteOne({ _id: objectId, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Reading not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Reading deleted successfully' });
  } catch (error) {
    console.error('Error deleting blood sugar reading:', error);
    return NextResponse.json(
      { error: 'Failed to delete blood sugar reading' },
      { status: 500 }
    );
  }
}

