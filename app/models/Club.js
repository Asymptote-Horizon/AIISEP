import mongoose from 'mongoose';

const ClubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a club name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    bannerImage: {
      type: String,
    },
    logo: {
      type: String,
    },
    facultyCoordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    studentLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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

// Index for finding clubs by creator
ClubSchema.index({ createdBy: 1 });
// Index for finding clubs a user is a member of
ClubSchema.index({ members: 1 });
// Index for faculty coordinator lookup
ClubSchema.index({ facultyCoordinatorId: 1 });

delete mongoose.models.Club;
export default mongoose.models.Club || mongoose.model('Club', ClubSchema);
