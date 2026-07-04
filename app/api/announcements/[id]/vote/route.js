import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Announcement from '@/app/models/Announcement';
import {
  requireAuth,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// POST /api/announcements/[id]/vote - Cast/toggle vote on a poll
export async function POST(request, { params }) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { optionId } = body;

    if (!optionId) {
      return apiError('Option ID is required', 400);
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return apiError('Announcement not found', 404);
    }

    if (!announcement.poll) {
      return apiError('This announcement does not have a poll', 400);
    }

    const userId = session.user.id;
    const option = announcement.poll.options.id(optionId);

    if (!option) {
      return apiError('Poll option not found', 404);
    }

    const hasVoted = option.votes.some(v => v.toString() === userId);

    if (hasVoted) {
      // Remove vote (toggle off)
      option.votes = option.votes.filter(v => v.toString() !== userId);
    } else {
      // If not multiSelect, remove vote from all other options first
      if (!announcement.poll.multiSelect) {
        for (const opt of announcement.poll.options) {
          opt.votes = opt.votes.filter(v => v.toString() !== userId);
        }
      }
      // Add vote
      option.votes.push(userId);
    }

    await announcement.save();

    const updated = await Announcement.findById(id)
      .populate('authorId', 'fullName email role')
      .lean();

    return NextResponse.json(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}
