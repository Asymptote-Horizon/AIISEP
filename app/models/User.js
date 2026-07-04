import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    // Student-only fields
    prn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    // Faculty-only fields
    designation: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    cabinNumber: {
      type: String,
      trim: true,
    },
    about: {
      type: String,
      maxlength: 500,
    },
    // Shared fields
    profilePhoto: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'deleted'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ prn: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ status: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
