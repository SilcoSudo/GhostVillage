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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    profile: {
      displayName: String,
      level: { type: Number, default: 1 },
      coin: { type: Number, default: 1000 },
      avatar: String
    },
    unlockedMedals: [String],
    selectedMedals: { type: [String], default: [] },
    // Sub-document để truy vấn tiến độ cực nhanh
    achievementsProgress: [{
      achievementCode: String,
      current: { type: Number, default: 0 },
      isClaimed: { type: Boolean, default: false }
    }]
  }, { timestamps: true }
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
