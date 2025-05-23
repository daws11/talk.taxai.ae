import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  transcript: string;
  summary: string;
  duration: number; // in seconds
  startTime: Date;
  endTime: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transcript: {
    type: String,
    required: false,
    default: "",
  },
  summary: {
    type: String,
    required: false,
    default: "No summary available",
  },
  duration: {
    type: Number,
    required: false,
    default: 0,
  },
  startTime: {
    type: Date,
    required: false,
    default: Date.now,
  },
  endTime: {
    type: Date,
    required: false,
    default: Date.now,
  },
  status: {
    type: String,
    required: false,
    default: "completed",
    enum: ["in_progress", "completed", "failed"]
  }
}, {
  timestamps: true,
  strict: false // Allow fields not in schema
});

// Delete the model if it exists to prevent OverwriteModelError
if (mongoose.models.Conversation) {
  delete mongoose.models.Conversation;
}

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema); 