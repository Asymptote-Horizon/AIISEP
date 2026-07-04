import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Notification from '@/app/models/Notification';
import { requireAuth, apiError, handleAuthError } from '@/app/lib/permissions';

// GET /api/notifications - Fetch current user's notifications
export async function GET(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let query = { userId: session.user.id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      await Notification.updateMany(
        { userId: session.user.id, isRead: false },
        { $set: { isRead: true } }
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, userId: session.user.id },
        { $set: { isRead: true } }
      );
    } else {
      return apiError('Provide notificationIds array or set markAllRead: true', 400);
    }

    return NextResponse.json({ message: 'Notifications updated' });
  } catch (error) {
    return handleAuthError(error);
  }
}
