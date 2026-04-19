import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoryDocument extends Document {
  slug: string;
  name: string;
  icon?: string;
  parentId?: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategoryDocument>('Category', CategorySchema);