import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';
import {
  requireAuth,
  requireAdmin,
  isAdmin,
  isFaculty,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// GET /api/users/[id] - Get a single user
export async function GET(request, { params }) {
  try {
    await requireAuth();
    await connectDB();

    const { id } = await params;
    const user = await User.findById(id).select('-passwordHash').lean();

    if (!user) {
      return apiError('User not found', 404);
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleAuthError(error);
  }
}

// PATCH /api/users/[id] - Update a user
export async function PATCH(request, { params }) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const user = await User.findById(id);

    if (!user) {
      return apiError('User not found', 404);
    }

    const isOwnProfile = session.user.id === id;
    const isAdminUser = isAdmin(session);

    // Admin can edit anything
    if (isAdminUser) {
      const adminEditableFields = [
        'fullName', 'email', 'department', 'designation', 'prn',
        'semester', 'phone', 'cabinNumber', 'about', 'profilePhoto', 'status',
      ];
      for (const field of adminEditableFields) {
        if (body[field] !== undefined) {
          user[field] = body[field];
        }
      }

      // Handle password change by admin
      if (body.newPassword) {
        user.passwordHash = await bcrypt.hash(body.newPassword, 12);
      }
    }
    // Faculty can edit their own limited fields
    else if (isOwnProfile && isFaculty(session)) {
      const facultyEditableFields = ['profilePhoto', 'phone', 'cabinNumber', 'about'];
      for (const field of facultyEditableFields) {
        if (body[field] !== undefined) {
          user[field] = body[field];
        }
      }
    }
    // Students can only update their profile photo
    else if (isOwnProfile && session.user.role === 'student') {
      if (body.profilePhoto !== undefined) {
        user.profilePhoto = body.profilePhoto;
      }
    }
    // Anyone can change their own password
    else if (isOwnProfile && body.currentPassword && body.newPassword) {
      // Verify current password only — no other changes
    }
    else {
      return apiError('Not authorized to edit this profile', 403);
    }

    // Password change for own account (any role)
    if (isOwnProfile && body.currentPassword && body.newPassword) {
      const isValid = await bcrypt.compare(body.currentPassword, user.passwordHash);
      if (!isValid) {
        return apiError('Current password is incorrect', 400);
      }
      user.passwordHash = await bcrypt.hash(body.newPassword, 12);
    }

    await user.save();

    const updated = await User.findById(id).select('-passwordHash').lean();
    return NextResponse.json(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE /api/users/[id] - Soft delete a user (Admin only)
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    const user = await User.findById(id);

    if (!user) {
      return apiError('User not found', 404);
    }

    if (user.role === 'admin') {
      return apiError('Cannot delete an admin account', 400);
    }

    // Soft delete
    user.status = 'deleted';
    await user.save();

    return NextResponse.json({ message: 'User account soft-deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
