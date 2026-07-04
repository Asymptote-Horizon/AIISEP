import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['announcement', 'message', 'club', 'calendar', 'system'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fetching user's notifications sorted by time
NotificationSchema.index({ userId: 1, createdAt: -1 });
// Index for counting unread notifications
NotificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.models.Notification ||
  mongoose.model('Notification', NotificationSchema);
