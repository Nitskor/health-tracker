import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { WeightReading, WeightFormData } from '@/types/weight';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: WeightFormData = await request.json();
    const { weight, timestamp, notes } = body;

    // Validation
    if (!weight || !timestamp) {
      return NextResponse.json({ 
        error: 'Weight and timestamp are required' 
      }, { status: 400 });
    }

    if (weight < 20 || weight > 300) {
      return NextResponse.json({ 
        error: 'Weight must be between 20-300 kg' 
      }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<WeightReading>('weight_readings');

    const reading: Omit<WeightReading, '_id'> = {
      userId,
      weight: Number(weight),
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
    console.error('Error adding weight reading:', error);
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

    const db = await getDatabase();
    const collection = db.collection<WeightReading>('weight_readings');

    const readings = await collection
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ readings });
  } catch (error) {
    console.error('Error fetching weight readings:', error);
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
    const { id, weight, timestamp, notes } = body;
    
    console.log('PUT request received:', { id, userId, body });

    if (!id) {
      return NextResponse.json({ error: 'Reading ID is required' }, { status: 400 });
    }

    // Validation
    if (!weight || !timestamp) {
      return NextResponse.json({ 
        error: 'Weight and timestamp are required' 
      }, { status: 400 });
    }

    if (weight < 20 || weight > 300) {
      return NextResponse.json({ 
        error: 'Weight must be between 20-300 kg' 
      }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<WeightReading>('weight_readings');

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
      weight: Number(weight),
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
    console.error('Error updating weight reading:', error);
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
    const collection = db.collection<WeightReading>('weight_readings');

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
    console.error('Error deleting weight reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
