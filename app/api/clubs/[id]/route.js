import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Club from '@/app/models/Club';
import {
  requireAuth,
  requireAdmin,
  isAdmin,
  isClubCoordinator,
  isClubLead,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// GET /api/clubs/[id] - Get a single club
export async function GET(request, { params }) {
  try {
    await requireAuth();
    await connectDB();

    const { id } = await params;
    const club = await Club.findById(id)
      .populate('facultyCoordinatorId', 'fullName email department')
      .populate('studentLeadId', 'fullName email')
      .populate('members', 'fullName email role')
      .populate('createdBy', 'fullName email')
      .lean();

    if (!club) {
      return apiError('Club not found', 404);
    }

    return NextResponse.json(club);
  } catch (error) {
    return handleAuthError(error);
  }
}

// PUT /api/clubs/[id] - Update a club (Admin, or Faculty Coordinator for lead)
export async function PUT(request, { params }) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { name, description, facultyCoordinatorId, studentLeadId, memberIds, logo } = body;

    const club = await Club.findById(id);
    if (!club) {
      return apiError('Club not found', 404);
    }

    const isCoordinator = session.user.role === 'faculty' && isClubCoordinator(club, session.user.id);
    const isLead = session.user.role === 'student' && isClubLead(club, session.user.id);
    const isSysAdmin = isAdmin(session);

    if (!isSysAdmin && !isCoordinator && !isLead) {
      return apiError('Not authorized', 403);
    }

    if (isSysAdmin) {
      if (name) club.name = name.trim();
      if (description !== undefined) club.description = description.trim();
      if (facultyCoordinatorId !== undefined) club.facultyCoordinatorId = facultyCoordinatorId || null;
      if (studentLeadId !== undefined) club.studentLeadId = studentLeadId || null;
      if (memberIds) club.members = memberIds;
      if (logo !== undefined) club.logo = logo;
    } else if (isCoordinator) {
      if (studentLeadId !== undefined) club.studentLeadId = studentLeadId || null;
      if (logo !== undefined) club.logo = logo;
    } else if (isLead) {
      if (logo !== undefined) club.logo = logo;
    }

    await club.save();

    const populated = await Club.findById(id)
      .populate('facultyCoordinatorId', 'fullName email department')
      .populate('studentLeadId', 'fullName email')
      .populate('members', 'fullName email role')
      .populate('createdBy', 'fullName email')
      .lean();

    return NextResponse.json(populated);
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE /api/clubs/[id] - Delete a club (Admin only)
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    const club = await Club.findById(id);

    if (!club) {
      return apiError('Club not found', 404);
    }

    // Delete club and all its announcements
    const Announcement = (await import('@/app/models/Announcement')).default;
    await Announcement.deleteMany({ clubId: id, scope: 'club' });
    await Club.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Club and its announcements deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
