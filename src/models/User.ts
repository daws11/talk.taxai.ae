import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  jobTitle: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 