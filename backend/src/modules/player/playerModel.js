import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    // Reference to User (Web account)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    // Player profile (Game-specific)
    profile: {
      displayName: {
        type: String,
        required: true,
        trim: true
      },
      avatar: {
        type: String,
        default: 'avatar_default_01'
      },
      level: {
        type: Number,
        default: 1,
        min: 1
      },
      exp: {
        type: Number,
        default: 0,
        min: 0
      },
      coin: {
        type: Number,
        default: 1000,
        min: 0
      }
    },

    // Inventory (Game items)
    inventory: {
      unlockedSkins: {
        type: [String],
        default: ['skin_default']
      },
      unlockedPerks: {
        type: [String],
        default: []
      }
    }
  },
  { timestamps: true }
);

// Populate User reference when returning JSON
playerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return obj;
};

const Player = mongoose.model('Player', playerSchema);

// Drop old email/username indexes if they exist (migration from old schema)
Player.collection.dropIndex('email_1').catch(() => {});
Player.collection.dropIndex('username_1').catch(() => {});

export default Player;
