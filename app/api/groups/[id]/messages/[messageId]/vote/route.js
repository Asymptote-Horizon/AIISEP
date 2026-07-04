import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import GroupMessage from '@/app/models/GroupMessage';
import Group from '@/app/models/Group';
import {
  requireAuth,
  isAdmin,
  isGroupMember,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// POST /api/groups/[id]/messages/[messageId]/vote - Cast/toggle vote on a group poll
export async function POST(request, { params }) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { id, messageId } = await params;
    const body = await request.json();
    const { optionId } = body;

    if (!optionId) {
      return apiError('Option ID is required', 400);
    }

    const group = await Group.findById(id);
    if (!group) {
      return apiError('Group not found', 404);
    }

    // Check membership
    if (!isAdmin(session) && !isGroupMember(group, session.user.id)) {
      return apiError('You are not a member of this group', 403);
    }

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return apiError('Message not found', 404);
    }

    if (!message.poll) {
      return apiError('This message does not have a poll', 400);
    }

    const userId = session.user.id;
    const option = message.poll.options.id(optionId);

    if (!option) {
      return apiError('Poll option not found', 404);
    }

    const hasVoted = option.votes.some(v => v.toString() === userId);

    if (hasVoted) {
      option.votes = option.votes.filter(v => v.toString() !== userId);
    } else {
      if (!message.poll.multiSelect) {
        for (const opt of message.poll.options) {
          opt.votes = opt.votes.filter(v => v.toString() !== userId);
        }
      }
      option.votes.push(userId);
    }

    await message.save();

    const updated = await GroupMessage.findById(messageId)
      .populate('senderId', 'fullName email role')
      .lean();

    return NextResponse.json(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}
