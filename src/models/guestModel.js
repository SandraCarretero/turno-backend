const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    avatar: {
      type: String,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    totalMatches: {
      type: Number,
      default: 0
    },
    totalWins: {
      type: Number,
      default: 0
    },
    syncedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    syncedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      maxlength: 500,
      default: null
    }
  },
  {
    timestamps: true
  }
);

guestSchema.index({ name: 1, createdBy: 1 });
guestSchema.index({ email: 1 });
guestSchema.index({ createdBy: 1, syncedWith: 1 });

const Guest = mongoose.model('Guest', guestSchema);

module.exports = Guest;
