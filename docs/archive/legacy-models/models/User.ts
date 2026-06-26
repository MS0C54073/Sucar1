import mongoose, { Schema, Document, CallbackWithoutResultAndOptionalError } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  nrc: string;
  role: 'client' | 'driver' | 'carwash' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Client specific
  businessName?: string;
  isBusiness?: boolean;
  
  // Driver specific
  licenseNo?: string;
  licenseType?: string;
  licenseExpiry?: Date;
  address?: string;
  maritalStatus?: string;
  availability?: boolean;
  
  // Car Wash specific
  carWashName?: string;
  location?: string;
  washingBays?: number;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true },
    nrc: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ['client', 'driver', 'carwash', 'admin'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    
    // Client fields
    businessName: { type: String },
    isBusiness: { type: Boolean, default: false },
    
    // Driver fields
    licenseNo: { type: String },
    licenseType: { type: String },
    licenseExpiry: { type: Date },
    address: { type: String },
    maritalStatus: { type: String },
    availability: { type: Boolean, default: true },
    
    // Car Wash fields
    carWashName: { type: String },
    location: { type: String },
    washingBays: { type: Number },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next: CallbackWithoutResultAndOptionalError) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
