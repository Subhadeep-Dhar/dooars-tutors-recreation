import mongoose, { Document, Schema } from 'mongoose';

export interface IReportDocument extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedProfileId: mongoose.Types.ObjectId;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReportDocument>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportedProfileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
      index: true
    },
  },
  { timestamps: true }
);

// Prevent a user from reporting the same profile multiple times while one is pending
ReportSchema.index({ reporterId: 1, reportedProfileId: 1, status: 1 });

export const Report = mongoose.model<IReportDocument>('Report', ReportSchema);
