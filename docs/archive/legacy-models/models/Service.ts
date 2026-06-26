import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  _id: string;
  carWashId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    carWashId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: {
      type: String,
      required: true,
      enum: ['Full Basic Wash', 'Engine Wash', 'Exterior Wash', 'Interior Wash', 'Wax and Polishing'],
    },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IService>('Service', ServiceSchema);
