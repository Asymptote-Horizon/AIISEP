import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import GroupMessage from '@/app/models/GroupMessage';
import Group from '@/app/models/Group';
import Notification from '@/app/models/Notification';
import {
  requireAuth,
  isAdmin,
  isGroupMember,
  isGroupLead,
  canMessageInGroup,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// GET /api/groups/[id]/messages - Fetch messages for a group
export async function GET(request, { params }) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { id } = await params;
    const group = await Group.findById(id);

    if (!group) {
      return apiError('Group not found', 404);
    }

    // Check membership (admin can see all)
    if (!isAdmin(session) && !isGroupMember(group, session.user.id)) {
      return apiError('You are not a member of this group', 403);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const before = searchParams.get('before');

    const now = new Date();
    let query = {
      groupId: id,
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    };
    if (before) {
      query.sentAt = { $lt: new Date(before) };
    }

    const messages = await GroupMessage.find(query)
      .populate('senderId', 'fullName email role')
      .sort({ sentAt: 1 })
      .limit(limit)
      .lean();

    // Mark notifications as read
    await Notification.updateMany({
      userId: session.user.id,
      type: 'message',
      referenceId: group._id,
      isRead: false
    }, {
      $set: { isRead: true }
    });

    return NextResponse.json(messages);
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/groups/[id]/messages - Send a message to a group
export async function POST(request, { params }) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { id } = await params;
    const group = await Group.findById(id);

    if (!group) {
      return apiError('Group not found', 404);
    }

    // Check if user can message in this group
    if (!canMessageInGroup(group, session)) {
      return apiError('You are not allowed to send messages in this group', 403);
    }

    const body = await request.json();
    const { content, attachments, expiresAt, poll, messageType } = body;

    // At least one of content, attachments, or poll must be provided
    const hasContent = content && content.trim();
    const hasAttachments = attachments && attachments.length > 0;
    const hasPoll = poll && poll.question;

    if (!hasContent && !hasAttachments && !hasPoll) {
      return apiError('Message must have content, attachments, or a poll', 400);
    }

    // Validate poll if provided
    if (hasPoll) {
      if (!poll.options || poll.options.length < 2) {
        return apiError('Poll must have at least 2 options', 400);
      }
    }

    const messageData = {
      groupId: id,
      senderId: session.user.id,
      content: hasContent ? content.trim() : '',
      sentAt: new Date(),
      messageType: messageType || (hasPoll ? 'poll' : 'text'),
    };

    if (hasAttachments) {
      messageData.attachments = attachments;
    }
    if (expiresAt) {
      messageData.expiresAt = new Date(expiresAt);
    }
    if (hasPoll) {
      messageData.poll = {
        question: poll.question.trim(),
        options: poll.options.map(opt => ({
          text: typeof opt === 'string' ? opt.trim() : opt.text.trim(),
          votes: [],
        })),
        multiSelect: poll.multiSelect || false,
      };
    }

    const message = await GroupMessage.create(messageData);

    // Create notifications for other group members
    const otherMembers = group.members.filter(
      m => m.userId.toString() !== session.user.id
    );
    if (otherMembers.length > 0) {
      const notifications = otherMembers.map(m => ({
        userId: m.userId,
        type: 'message',
        referenceId: group._id,
        message: `New message in "${group.name}"`,
      }));
      await Notification.insertMany(notifications);
    }

    const populated = await GroupMessage.findById(message._id)
      .populate('senderId', 'fullName email role')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE /api/groups/[id]/messages - Delete a message
export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return apiError('Message ID is required', 400);
    }

    const group = await Group.findById(id);
    if (!group) {
      return apiError('Group not found', 404);
    }

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return apiError('Message not found', 404);
    }

    // Check permissions: admin, message sender, group lead, or faculty member can delete
    const isSender = message.senderId.toString() === session.user.id;
    const isLead = isGroupLead(group, session.user.id);
    const isFacultyMember = session.user.role === 'faculty' && isGroupMember(group, session.user.id);

    if (!isAdmin(session) && !isSender && !isLead && !isFacultyMember) {
      return apiError('Not authorized to delete this message', 403);
    }

    await GroupMessage.findByIdAndDelete(messageId);

    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
