import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { BloodPressureReading, BloodPressureFormData } from '@/types/blood-pressure';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BloodPressureFormData = await request.json();
    const { systolic, diastolic, readingType, timestamp, notes } = body;

    // Validation
    if (!systolic || !diastolic || !readingType || !timestamp) {
      return NextResponse.json({ 
        error: 'Systolic, diastolic, reading type, and timestamp are required' 
      }, { status: 400 });
    }

    if (systolic < 50 || systolic > 300 || diastolic < 30 || diastolic > 200) {
      return NextResponse.json({ 
        error: 'Invalid blood pressure values' 
      }, { status: 400 });
    }

    if (systolic <= diastolic) {
      return NextResponse.json({ 
        error: 'Systolic must be greater than diastolic' 
      }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<BloodPressureReading>('blood_pressure');

    const reading: Omit<BloodPressureReading, '_id'> = {
      userId,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      readingType,
      timestamp: new Date(timestamp),
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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

    const db = await getDatabase();
    const collection = db.collection<BloodPressureReading>('blood_pressure');

    // Build query
    const query: any = { userId };
    if (type) {
      query.readingType = type;
    }

    const readings = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

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
    const { id, systolic, diastolic, readingType, timestamp, notes } = body;
    
    console.log('PUT request received:', { id, userId, body });

    if (!id) {
      return NextResponse.json({ error: 'Reading ID is required' }, { status: 400 });
    }

    // Validation
    if (!systolic || !diastolic || !readingType || !timestamp) {
      return NextResponse.json({ 
        error: 'Systolic, diastolic, reading type, and timestamp are required' 
      }, { status: 400 });
    }

    if (systolic < 50 || systolic > 300 || diastolic < 30 || diastolic > 200) {
      return NextResponse.json({ 
        error: 'Invalid blood pressure values' 
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
    } catch (error) {
      return NextResponse.json({ error: 'Invalid reading ID format' }, { status: 400 });
    }
    
    const existingReading = await collection.findOne({ _id: objectId as any, userId });
    if (!existingReading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    const updateData = {
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      readingType,
      timestamp: new Date(timestamp),
      notes: notes || '',
      updatedAt: new Date(),
    };

    const result = await collection.updateOne(
      { _id: objectId as any, userId },
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
    } catch (error) {
      return NextResponse.json({ error: 'Invalid reading ID format' }, { status: 400 });
    }
    
    const result = await collection.deleteOne({ _id: objectId as any, userId });

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
