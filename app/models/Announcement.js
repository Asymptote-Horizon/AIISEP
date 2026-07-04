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

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorRole: {
      type: String,
      enum: ['admin', 'faculty', 'clubLead'],
      required: true,
    },
    target: {
      type: String,
      enum: ['all', 'students', 'faculty', 'department'],
      default: 'all',
    },
    targetDepartment: {
      type: String,
      trim: true,
    },
    scope: {
      type: String,
      enum: ['global', 'club'],
      default: 'global',
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    // New fields
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

// Index for sorting by date
AnnouncementSchema.index({ createdAt: -1 });
// Index for filtering by scope and club
AnnouncementSchema.index({ scope: 1, clubId: 1 });
// Index for filtering by target
AnnouncementSchema.index({ target: 1 });
// Index for expiry cleanup
AnnouncementSchema.index({ expiresAt: 1 }, { sparse: true });

export default mongoose.models.Announcement ||
  mongoose.model('Announcement', AnnouncementSchema);
