const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    bggId: String,
    name: String,
    image: String
  },
  { _id: false }
);

const playerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Guest",
    default: null,
  },
  guestId: {
    type: String,
    default: null,
  },
  guestName: {
    type: String,
    default: null
  },
  guestAvatar: { 
    type: String,
    default: null
  },
  score: {
    type: Number,
    default: 0
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  team: {
    type: String,
    default: null
  }
});

const matchSchema = new mongoose.Schema(
  {
    game: {
      type: gameSchema,
      required: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    players: [playerSchema],
    duration: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      maxlength: 500
    },
    isTeamGame: {
      type: Boolean,
      default: false
    },
    isCooperative: {
      type: Boolean,
      default: false
    },
    hasWinner: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed'],
      default: 'completed'
    }
  },
  {
    timestamps: true
  }
);

const Match = mongoose.model('Match', matchSchema);

module.exports = Match
