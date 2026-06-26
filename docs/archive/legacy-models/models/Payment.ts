import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  _id: string;
  bookingId: mongoose.Types.ObjectId;
  amount: number;
  method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['cash', 'card', 'mobile_money', 'bank_transfer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: { type: String },
    paymentDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ status: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
