import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // 'image', 'pdf', 'file'
  mimeType: { type: String },
  data: { type: String, required: true }, // Base64 string
}, { _id: false });

const PollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: [PollOptionSchema],
  multiSelect: { type: Boolean, default: false },
}, { _id: false });

const GroupMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    // New fields
    messageType: {
      type: String,
      enum: ['text', 'announcement', 'poll'],
      default: 'text',
    },
    attachments: [AttachmentSchema],
    expiresAt: {
      type: Date,
      default: null,
    },
    poll: PollSchema,
  },
  {
    timestamps: true,
  }
);

// Index for fetching messages by group, sorted by time
GroupMessageSchema.index({ groupId: 1, sentAt: 1 });
// Index for expiry cleanup
GroupMessageSchema.index({ expiresAt: 1 }, { sparse: true });

export default mongoose.models.GroupMessage ||
  mongoose.model('GroupMessage', GroupMessageSchema);
