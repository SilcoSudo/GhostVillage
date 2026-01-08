import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const playerSchema = new mongoose.Schema(
  {
    // Auth fields
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },

    // Profile fields
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      default: ''
    },

    // Status fields
    isActive: {
      type: Boolean,
      default: true
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    
    // Game fields (for future use)
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    coins: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Hash password before saving
playerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
playerSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Remove password from JSON response
playerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Player = mongoose.model('Player', playerSchema);

export default Player;
