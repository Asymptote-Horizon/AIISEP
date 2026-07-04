import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'faculty'],
    required: true,
  },
  isLead: {
    type: Boolean,
    default: false,
  },
});

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a group name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    members: [MemberSchema],
    messagingMode: {
      type: String,
      enum: ['open', 'restricted'],
      default: 'open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding groups by creator
GroupSchema.index({ createdBy: 1 });
// Index for finding groups a user is a member of
GroupSchema.index({ 'members.userId': 1 });

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);
