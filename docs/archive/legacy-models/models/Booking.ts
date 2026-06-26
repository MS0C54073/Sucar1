import mongoose, { Schema, Document } from 'mongoose';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'picked_up'
  | 'at_wash'
  | 'waiting_bay'
  | 'washing_bay'
  | 'drying_bay'
  | 'wash_completed'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface IBooking extends Document {
  _id: string;
  clientId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  carWashId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  pickupLocation: string;
  pickupCoordinates?: {
    lat: number;
    lng: number;
  };
  status: BookingStatus;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  scheduledPickupTime?: Date;
  actualPickupTime?: Date;
  washStartTime?: Date;
  washCompleteTime?: Date;
  deliveryTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },
    carWashId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    pickupLocation: { type: String, required: true },
    pickupCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'declined',
        'picked_up',
        'at_wash',
        'waiting_bay',
        'washing_bay',
        'drying_bay',
        'wash_completed',
        'delivered',
        'completed',
        'cancelled',
      ],
      default: 'pending',
    },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    scheduledPickupTime: { type: Date },
    actualPickupTime: { type: Date },
    washStartTime: { type: Date },
    washCompleteTime: { type: Date },
    deliveryTime: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
BookingSchema.index({ clientId: 1, createdAt: -1 });
BookingSchema.index({ driverId: 1, status: 1 });
BookingSchema.index({ carWashId: 1, status: 1 });
BookingSchema.index({ status: 1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);
