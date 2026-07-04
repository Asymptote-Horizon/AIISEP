import mongoose from 'mongoose';

const AcademicCalendarSchema = new mongoose.Schema(
  {
    fileUrl: {
      type: String,
      required: [true, 'Please provide a file URL'],
    },
    fileName: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding the active calendar quickly
AcademicCalendarSchema.index({ isActive: 1 });

export default mongoose.models.AcademicCalendar ||
  mongoose.model('AcademicCalendar', AcademicCalendarSchema);
