import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';
import {
  requireAdmin,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// POST /api/users/block - Toggle block/unblock status (Admin only)
export async function POST(request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return apiError('userId and action are required', 400);
    }

    if (!['block', 'unblock'].includes(action)) {
      return apiError('Action must be "block" or "unblock"', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return apiError('User not found', 404);
    }

    if (user.role === 'admin') {
      return apiError('Cannot block an admin account', 400);
    }

    if (user.status === 'deleted') {
      return apiError('Cannot modify a deleted account', 400);
    }

    user.status = action === 'block' ? 'blocked' : 'active';
    await user.save();

    return NextResponse.json({
      message: `User ${action}ed successfully`,
      status: user.status,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
