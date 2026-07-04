import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Group from '@/app/models/Group';

export async function GET(request) {
  try {
    await connectDB();
    const group = await Group.findOne();
    if (!group) return NextResponse.json({ error: 'No groups' });

    // Try doing exactly what PUT does
    group.messagingMode = group.messagingMode === 'open' ? 'restricted' : 'open';
    await group.save();

    const populated = await Group.findById(group._id)
      .populate('members.userId', 'fullName email role')
      .populate('createdBy', 'fullName email')
      .lean();

    return NextResponse.json({ success: true, group: populated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack });
  }
}
