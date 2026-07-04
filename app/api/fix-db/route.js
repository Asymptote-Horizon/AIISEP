import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Group from '@/app/models/Group';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    const result1 = await mongoose.connection.db.collection('groups').updateMany(
      { name: { $exists: false } },
      { $set: { name: 'Untitled Group' } }
    );
    const result2 = await mongoose.connection.db.collection('groups').updateMany(
      { name: '' },
      { $set: { name: 'Untitled Group' } }
    );
    return NextResponse.json({
      success: true,
      fixedMissing: result1.modifiedCount,
      fixedEmpty: result2.modifiedCount
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
