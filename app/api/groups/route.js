import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Group from '@/app/models/Group';
import Notification from '@/app/models/Notification';
import User from '@/app/models/User';
import {
  requireAuth,
  requireAdmin,
  isAdmin,
  isGroupMember,
  isGroupLead,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// GET /api/groups - List groups visible to the current user
export async function GET(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    let groups;

    if (isAdmin(session)) {
      // Admin sees all groups
      groups = await Group.find()
        .populate('members.userId', 'fullName email role')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Faculty and students see only groups they are members of
      groups = await Group.find({ 'members.userId': session.user.id })
        .populate('members.userId', 'fullName email role')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Calculate unread count for each group
    const groupsWithUnread = await Promise.all(groups.map(async (group) => {
      const unreadCount = await Notification.countDocuments({
        userId: session.user.id,
        type: 'message',
        referenceId: group._id,
        isRead: false,
      });
      return {
        ...group,
        unreadCount,
      };
    }));

    return NextResponse.json(groupsWithUnread);
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/groups - Create a new group (Admin only)
export async function POST(request) {
  try {
    const session = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { name, description, memberIds, messagingMode } = body;

    if (!name) {
      return apiError('Group name is required', 400);
    }

    // Build members array with roles
    const members = [];
    if (memberIds && memberIds.length > 0) {
      const users = await User.find({ _id: { $in: memberIds }, status: 'active' }).lean();
      for (const user of users) {
        members.push({
          userId: user._id,
          role: user.role,
          isLead: false,
        });
      }
    }

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || '',
      members,
      messagingMode: messagingMode || 'open',
      createdBy: session.user.id,
    });

    // Create notifications for added members
    if (members.length > 0) {
      const notifications = members.map((m) => ({
        userId: m.userId,
        type: 'system',
        referenceId: group._id,
        message: `You have been added to the group "${name}"`,
      }));
      await Notification.insertMany(notifications);
    }

    const populated = await Group.findById(group._id)
      .populate('members.userId', 'fullName email role')
      .populate('createdBy', 'fullName email')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PUT /api/groups - Update a group (Admin only, or faculty for messaging mode)
export async function PUT(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { groupId, name, description, messagingMode, addMemberIds, removeMemberIds, leadUserId, revokeLeadUserId } = body;

    if (!groupId) {
      return apiError('Group ID is required', 400);
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return apiError('Group not found', 404);
    }

    // Admin can do everything
    if (isAdmin(session)) {
      if (name && name.trim() !== '') group.name = name.trim();
      else if (!group.name) group.name = 'Untitled Group'; // Fix for existing groups with missing names
      
      if (description !== undefined && description !== null) group.description = description.trim();
      if (messagingMode) group.messagingMode = messagingMode;

      // Add members
      if (addMemberIds && addMemberIds.length > 0) {
        const users = await User.find({ _id: { $in: addMemberIds }, status: 'active' }).lean();
        for (const user of users) {
          const alreadyMember = group.members.some(m => m.userId.toString() === user._id.toString());
          if (!alreadyMember) {
            group.members.push({ userId: user._id, role: user.role, isLead: false });
          }
        }
        // Notify new members
        const notifications = users
          .filter(u => !group.members.some(m => m.userId.toString() === u._id.toString() && addMemberIds.includes(u._id.toString())))
          .map(u => ({
            userId: u._id,
            type: 'system',
            referenceId: group._id,
            message: `You have been added to the group "${group.name}"`,
          }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }

      // Remove members
      if (removeMemberIds && removeMemberIds.length > 0) {
        group.members = group.members.filter(
          m => !removeMemberIds.includes(m.userId.toString())
        );
      }
    }
    // Faculty in the group can edit name, description, messaging mode, and members
    else if (session.user.role === 'faculty' && isGroupMember(group, session.user.id)) {
      if (name && name.trim() !== '') group.name = name.trim();
      if (description !== undefined && description !== null) group.description = description.trim();
      if (messagingMode) group.messagingMode = messagingMode;

      // Add members
      if (addMemberIds && addMemberIds.length > 0) {
        const users = await User.find({ _id: { $in: addMemberIds }, status: 'active' }).lean();
        for (const user of users) {
          const alreadyMember = group.members.some(m => m.userId.toString() === user._id.toString());
          if (!alreadyMember) {
            group.members.push({ userId: user._id, role: user.role, isLead: false });
          }
        }
        const newNotifications = users
          .filter(u => !group.members.some(m => m.userId.toString() === u._id.toString() && addMemberIds.includes(u._id.toString())))
          .map(u => ({
            userId: u._id,
            type: 'system',
            referenceId: group._id,
            message: `You have been added to the group "${group.name}"`,
          }));
        if (newNotifications.length > 0) {
          await Notification.insertMany(newNotifications);
        }
      }

      // Remove members
      if (removeMemberIds && removeMemberIds.length > 0) {
        group.members = group.members.filter(
          m => !removeMemberIds.includes(m.userId.toString())
        );
      }
    }
    // Student leads in the group can edit name, description, and members
    else if (session.user.role === 'student' && isGroupLead(group, session.user.id)) {
      if (name && name.trim() !== '') group.name = name.trim();
      if (description !== undefined && description !== null) group.description = description.trim();

      // Add members
      if (addMemberIds && addMemberIds.length > 0) {
        const users = await User.find({ _id: { $in: addMemberIds }, status: 'active' }).lean();
        for (const user of users) {
          const alreadyMember = group.members.some(m => m.userId.toString() === user._id.toString());
          if (!alreadyMember) {
            group.members.push({ userId: user._id, role: user.role, isLead: false });
          }
        }
        const newNotifications = users
          .filter(u => !group.members.some(m => m.userId.toString() === u._id.toString() && addMemberIds.includes(u._id.toString())))
          .map(u => ({
            userId: u._id,
            type: 'system',
            referenceId: group._id,
            message: `You have been added to the group "${group.name}"`,
          }));
        if (newNotifications.length > 0) {
          await Notification.insertMany(newNotifications);
        }
      }

      // Remove members
      if (removeMemberIds && removeMemberIds.length > 0) {
        group.members = group.members.filter(
          m => !removeMemberIds.includes(m.userId.toString())
        );
      }
    }
    else {
      return apiError('Not authorized to update this group', 403);
    }

    // Nominate a student lead (admin or faculty in group)
    if (leadUserId) {
      const canNominate = isAdmin(session) ||
        (session.user.role === 'faculty' && isGroupMember(group, session.user.id));
      if (canNominate) {
        const member = group.members.find(m => m.userId.toString() === leadUserId);
        if (member && member.role === 'student') {
          member.isLead = true;
        }
      }
    }

    // Revoke a student lead
    if (revokeLeadUserId) {
      const canRevoke = isAdmin(session) ||
        (session.user.role === 'faculty' && isGroupMember(group, session.user.id));
      if (canRevoke) {
        const member = group.members.find(m => m.userId.toString() === revokeLeadUserId);
        if (member) {
          member.isLead = false;
        }
      }
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate('members.userId', 'fullName email role')
      .populate('createdBy', 'fullName email')
      .lean();

    return NextResponse.json(populated);
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE /api/groups - Soft delete a group (Admin only)
export async function DELETE(request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');

    if (!groupId) {
      return apiError('Group ID is required', 400);
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return apiError('Group not found', 404);
    }

    // Notify members before deletion
    const notifications = group.members
      .filter(m => m && m.userId)
      .map((m) => ({
        userId: m.userId._id || m.userId,
        type: 'system',
        referenceId: group._id,
        message: `The group "${group.name || 'Untitled Group'}" has been deleted`,
      }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Soft delete (we could set a deleted flag, but for simplicity we delete)
    await Group.findByIdAndDelete(groupId);

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
