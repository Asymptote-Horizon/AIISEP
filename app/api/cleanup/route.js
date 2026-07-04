import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Announcement from '@/app/models/Announcement';
import GroupMessage from '@/app/models/GroupMessage';

// GET /api/cleanup - Remove expired announcements and messages
export async function GET() {
  try {
    await connectDB();

    const now = new Date();

    const announcementResult = await Announcement.deleteMany({
      expiresAt: { $ne: null, $lte: now },
    });

    const messageResult = await GroupMessage.deleteMany({
      expiresAt: { $ne: null, $lte: now },
    });

    return NextResponse.json({
      message: 'Cleanup completed',
      deletedAnnouncements: announcementResult.deletedCount,
      deletedMessages: messageResult.deletedCount,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
