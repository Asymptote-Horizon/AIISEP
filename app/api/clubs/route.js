import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Club from '@/app/models/Club';
import Announcement from '@/app/models/Announcement';
import User from '@/app/models/User';
import Notification from '@/app/models/Notification';
import {
  requireAuth,
  requireAdmin,
  isAdmin,
  isClubCoordinator,
  isClubLead,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// GET /api/clubs - List all clubs
export async function GET(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const clubs = await Club.find()
      .populate('facultyCoordinatorId', 'fullName email department')
      .populate('studentLeadId', 'fullName email')
      .populate('members', 'fullName email role')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    // Add permission flags and unread counts for the current user
    const enrichedClubs = await Promise.all(clubs.map(async (club) => {
      // Find announcements for this club to check notifications
      const announcements = await Announcement.find({ scope: 'club', clubId: club._id }).select('_id').lean();
      const announcementIds = announcements.map(a => a._id);

      const unreadCount = await Notification.countDocuments({
        userId: session.user.id,
        type: 'club',
        referenceId: { $in: announcementIds },
        isRead: false
      });

      return {
        ...club,
        isCoordinator: isClubCoordinator(club, session.user.id),
        isLead: isClubLead(club, session.user.id),
        isMember: club.members?.some(m => m._id.toString() === session.user.id),
        isAdmin: isAdmin(session),
        unreadCount
      };
    }));

    return NextResponse.json(enrichedClubs);
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/clubs - Create a new club (Admin only)
export async function POST(request) {
  try {
    const session = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { name, description, facultyCoordinatorId, studentLeadId, memberIds } = body;

    if (!name) {
      return apiError('Club name is required', 400);
    }

    const club = await Club.create({
      name: name.trim(),
      description: description?.trim() || '',
      facultyCoordinatorId: facultyCoordinatorId || undefined,
      studentLeadId: studentLeadId || undefined,
      members: memberIds || [],
      createdBy: session.user.id,
    });

    const populated = await Club.findById(club._id)
      .populate('facultyCoordinatorId', 'fullName email department')
      .populate('studentLeadId', 'fullName email')
      .populate('members', 'fullName email role')
      .populate('createdBy', 'fullName email')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
