import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Test the connection by pinging the database
    await db.admin().ping();
    
    // Get some basic info about the database
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connection successful!',
      database: 'health-tracker',
      collections: collections.map(col => col.name)
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to MongoDB',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
