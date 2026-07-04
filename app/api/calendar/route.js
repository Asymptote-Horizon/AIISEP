import { NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/app/lib/db';
import AcademicCalendar from '@/app/models/AcademicCalendar';
import Notification from '@/app/models/Notification';
import User from '@/app/models/User';
import { requireAuth, requireAdmin, apiError, handleAuthError } from '@/app/lib/permissions';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'calendars');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    // directory already exists
  }
}

// GET /api/calendar - Get the active calendar
export async function GET() {
  try {
    await requireAuth();
    await connectDB();

    const calendar = await AcademicCalendar.findOne({ isActive: true })
      .populate('uploadedBy', 'fullName email')
      .lean();

    return NextResponse.json(calendar || null);
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/calendar - Upload a new calendar (Admin only)
export async function POST(request) {
  try {
    const session = await requireAdmin();
    await connectDB();
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return apiError('File is required', 400);
    }

    // Deactivate any existing active calendar
    await AcademicCalendar.updateMany({ isActive: true }, { isActive: false });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    await writeFile(filePath, buffer);

    const calendar = await AcademicCalendar.create({
      fileUrl: `/uploads/calendars/${fileName}`,
      fileName: file.name,
      uploadedBy: session.user.id,
      uploadedAt: new Date(),
      isActive: true,
    });

    // Notify all active users about calendar update
    const allUsers = await User.find({ status: 'active' }).select('_id').lean();
    const notifications = allUsers
      .filter(u => u._id.toString() !== session.user.id)
      .map(u => ({
        userId: u._id,
        type: 'calendar',
        referenceId: calendar._id,
        message: 'The academic calendar has been updated',
      }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json(calendar, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PUT /api/calendar - Replace the active calendar (Admin only)
export async function PUT(request) {
  try {
    const session = await requireAdmin();
    await connectDB();
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || file.size === 0) {
      return apiError('File is required', 400);
    }

    // Deactivate and delete old active calendar file
    const oldCalendar = await AcademicCalendar.findOne({ isActive: true });
    if (oldCalendar) {
      try {
        const oldFilePath = path.join(process.cwd(), 'public', oldCalendar.fileUrl);
        await unlink(oldFilePath);
      } catch (e) {
        // old file may not exist
      }
      oldCalendar.isActive = false;
      await oldCalendar.save();
    }

    // Save new file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    await writeFile(filePath, buffer);

    const calendar = await AcademicCalendar.create({
      fileUrl: `/uploads/calendars/${fileName}`,
      fileName: file.name,
      uploadedBy: session.user.id,
      uploadedAt: new Date(),
      isActive: true,
    });

    return NextResponse.json(calendar);
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE /api/calendar - Delete the active calendar (Admin only)
export async function DELETE(request) {
  try {
    await requireAdmin();
    await connectDB();

    const calendar = await AcademicCalendar.findOne({ isActive: true });
    if (!calendar) {
      return apiError('No active calendar to delete', 404);
    }

    // Delete file
    try {
      const filePath = path.join(process.cwd(), 'public', calendar.fileUrl);
      await unlink(filePath);
    } catch (e) {
      // file may not exist
    }

    await AcademicCalendar.findByIdAndDelete(calendar._id);

    return NextResponse.json({ message: 'Calendar deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
