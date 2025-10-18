import { Schema, model } from 'mongoose';

const MessageSchema = new Schema(
  {
    senderId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ChatSchema = new Schema(
  {
    reservationId: {
      type: String,
      required: true,
      ref: 'Reservation',
      unique: true,
      index: true,
    },
    participants: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length === 2;
        },
        message: 'A chat must have exactly 2 participants',
      },
    },
    messages: [MessageSchema],
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient participant queries
ChatSchema.index({ participants: 1 });

export default model('Chat', ChatSchema);

