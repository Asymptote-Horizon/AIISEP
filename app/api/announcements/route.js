import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Announcement from '@/app/models/Announcement';
import Club from '@/app/models/Club';
import Notification from '@/app/models/Notification';
import User from '@/app/models/User';
import {
  requireAuth,
  isAdmin,
  isFaculty,
  isClubCoordinator,
  isClubLead,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// GET /api/announcements - List announcements
export async function GET(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const scope = searchParams.get('scope') || 'global';
    const clubId = searchParams.get('clubId');
    const skip = (page - 1) * limit;

    let query = {};

    // Filter out expired announcements
    const now = new Date();
    query.$and = [
      { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] }
    ];

    if (scope === 'club' && clubId) {
      query.scope = 'club';
      query.clubId = clubId;
    } else {
      query.scope = 'global';

      // Filter based on target audience for non-admin users
      if (!isAdmin(session)) {
        const role = session.user.role;
        const dept = session.user.department;

        const targetFilter = [
          { target: 'all' },
          { target: role === 'student' ? 'students' : 'faculty' },
        ];

        if (dept) {
          targetFilter.push({ target: 'department', targetDepartment: dept });
        }

        query.$and.push({ $or: targetFilter });
      }
    }

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .populate('authorId', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Strip attachment data from list view to reduce payload (keep metadata only)
    const lightAnnouncements = announcements.map(a => ({
      ...a,
      attachments: a.attachments?.map(att => ({
        name: att.name,
        type: att.type,
        mimeType: att.mimeType,
        data: att.data, // Keep data for rendering
      })),
    }));

    // If fetching for a specific club, mark its notifications as read
    if (scope === 'club' && clubId) {
      const announcementIds = announcements.map(a => a._id);
      if (announcementIds.length > 0) {
        await Notification.updateMany({
          userId: session.user.id,
          type: 'club',
          referenceId: { $in: announcementIds },
          isRead: false
        }, {
          $set: { isRead: true }
        });
      }
    }

    return NextResponse.json({
      announcements: lightAnnouncements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/announcements - Create announcement
export async function POST(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { title, content, target, targetDepartment, scope, clubId, attachments, expiresAt, poll } = body;

    const hasTitle = title && title.trim();
    const hasContent = content && content.trim();
    const hasAttachments = attachments && attachments.length > 0;
    const hasPoll = poll && poll.question;

    if (!hasTitle && !hasContent && !hasAttachments && !hasPoll) {
      return apiError('Announcement must have a title, content, attachments, or a poll', 400);
    }

    let authorRole;

    // Determine authorRole and check permissions
    if (scope === 'club' && clubId) {
      const club = await Club.findById(clubId);
      if (!club) {
        return apiError('Club not found', 404);
      }

      if (isAdmin(session)) {
        authorRole = 'admin';
      } else if (isClubCoordinator(club, session.user.id)) {
        authorRole = 'faculty';
      } else if (isClubLead(club, session.user.id)) {
        authorRole = 'clubLead';
      } else {
        return apiError('Not authorized to post club announcements', 403);
      }
    } else {
      // Global announcement
      if (isAdmin(session)) {
        authorRole = 'admin';
      } else if (isFaculty(session)) {
        authorRole = 'faculty';
      } else {
        return apiError('Not authorized to create announcements', 403);
      }
    }

    // Validate poll if provided
    if (poll && poll.question) {
      if (!poll.options || poll.options.length < 2) {
        return apiError('Poll must have at least 2 options', 400);
      }
    }

    const announcementData = {
      title: hasTitle ? title.trim() : '',
      content: hasContent ? content : '',
      authorId: session.user.id,
      authorRole,
      target: target || 'all',
      targetDepartment: target === 'department' ? targetDepartment : undefined,
      scope: scope || 'global',
      clubId: scope === 'club' ? clubId : undefined,
    };

    // Add optional fields
    if (attachments && attachments.length > 0) {
      announcementData.attachments = attachments;
    }
    if (expiresAt) {
      announcementData.expiresAt = new Date(expiresAt);
    }
    if (poll && poll.question) {
      announcementData.poll = {
        question: poll.question.trim(),
        options: poll.options.map(opt => ({
          text: typeof opt === 'string' ? opt.trim() : opt.text.trim(),
          votes: [],
        })),
        multiSelect: poll.multiSelect || false,
      };
    }

    const announcement = await Announcement.create(announcementData);

    // Create notifications for target users
    let targetQuery = { status: 'active' };
    if (scope === 'club' && clubId) {
      // For club announcements, notify club members
      const club = await Club.findById(clubId);
      if (club && club.members && club.members.length > 0) {
        const notifications = club.members
          .filter(mId => mId.toString() !== session.user.id)
          .map(mId => ({
            userId: mId,
            type: 'club',
            referenceId: announcement._id,
            message: `New announcement in "${club.name}": "${title}"`,
          }));
        // Also notify coordinator and lead
        if (club.facultyCoordinatorId && club.facultyCoordinatorId.toString() !== session.user.id) {
          notifications.push({
            userId: club.facultyCoordinatorId,
            type: 'club',
            referenceId: announcement._id,
            message: `New announcement in "${club.name}": "${title}"`,
          });
        }
        if (club.studentLeadId && club.studentLeadId.toString() !== session.user.id) {
          notifications.push({
            userId: club.studentLeadId,
            type: 'club',
            referenceId: announcement._id,
            message: `New announcement in "${club.name}": "${title}"`,
          });
        }
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } else {
      if (target === 'students') targetQuery.role = 'student';
      else if (target === 'faculty') targetQuery.role = 'faculty';
      else if (target === 'department' && targetDepartment) {
        targetQuery.department = targetDepartment;
      }

      const targetUsers = await User.find(targetQuery).select('_id').lean();
      if (targetUsers.length > 0) {
        const notifications = targetUsers
          .filter(u => u._id.toString() !== session.user.id)
          .map(u => ({
            userId: u._id,
            type: scope === 'club' ? 'club' : 'announcement',
            referenceId: announcement._id,
            message: `New announcement: "${title}"`,
          }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    }

    const populated = await Announcement.findById(announcement._id)
      .populate('authorId', 'fullName email role')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PUT /api/announcements - Edit announcement
export async function PUT(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { announcementId, title, content, target, targetDepartment } = body;

    if (!announcementId) {
      return apiError('Announcement ID is required', 400);
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return apiError('Announcement not found', 404);
    }

    // Permission check: admin can edit any, faculty can edit their own
    const isCreator = announcement.authorId.toString() === session.user.id;

    if (!isAdmin(session) && !isCreator) {
      return apiError('Not authorized to edit this announcement', 403);
    }

    if (title) announcement.title = title.trim();
    if (content) announcement.content = content;
    if (target && isAdmin(session)) {
      announcement.target = target;
      announcement.targetDepartment = target === 'department' ? targetDepartment : undefined;
    }

    await announcement.save();

    const populated = await Announcement.findById(announcementId)
      .populate('authorId', 'fullName email role')
      .lean();

    return NextResponse.json(populated);
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE /api/announcements - Delete announcement
export async function DELETE(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const announcementId = searchParams.get('id');

    if (!announcementId) {
      return apiError('Announcement ID is required', 400);
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return apiError('Announcement not found', 404);
    }

    const isCreator = announcement.authorId.toString() === session.user.id;

    // For club announcements, also allow club coordinator and lead to delete
    let canDelete = isAdmin(session) || isCreator;
    if (!canDelete && announcement.scope === 'club' && announcement.clubId) {
      const club = await Club.findById(announcement.clubId);
      if (club) {
        canDelete = isClubCoordinator(club, session.user.id) || isClubLead(club, session.user.id);
      }
    }

    if (!canDelete) {
      return apiError('Not authorized to delete this announcement', 403);
    }

    await Announcement.findByIdAndDelete(announcementId);

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
