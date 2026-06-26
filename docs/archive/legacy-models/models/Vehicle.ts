import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle {
  _id: string;
  clientId: mongoose.Types.ObjectId;
  make: string;
  model: string;
  plateNo: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    plateNo: { type: String, required: true, uppercase: true },
    color: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
