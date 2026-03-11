import mongoose from "mongoose";

/**
 * Quest Schema
 * Định nghĩa cấu trúc dữ liệu cho nhiệm vụ trong game
 */

// Schema con: Objectives (Mục tiêu)
const ObjectiveSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["kill", "collect", "reach", "interact", "survive", "escort"],
      comment: "Loại nhiệm vụ: kill monsters, collect items, reach location, etc.",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    target: {
      type: String,
      required: true,
      comment: "Mục tiêu cụ thể (VD: 'MONSTER_001', 'ITEM_KEY', 'MAP_GATE')",
    },
    required: {
      type: Number,
      required: true,
      min: 1,
      comment: "Số lượng cần hoàn thành",
    },
    current: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Tiến độ hiện tại (được cập nhật từ game)",
    },
  },
  { _id: false }
);

// Schema con: Rewards (Phần thưởng)
const RewardSchema = new mongoose.Schema(
  {
    exp: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Kinh nghiệm nhận được",
    },
    coin: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Tiền xu nhận được",
    },
    items: [
      {
        itemId: {
          type: String,
          required: true,
          comment: "ID của vật phẩm thưởng",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          comment: "Số lượng vật phẩm",
        },
      },
    ],
    titles: [
      {
        type: String,
        comment: "Danh hiệu đặc biệt nhận được (VD: 'Ghost Hunter', 'Survivor')",
      },
    ],
  },
  { _id: false }
);

// Schema chính: Quest
const QuestSchema = new mongoose.Schema(
  {
    questId: {
      type: String,
      required: [true, "Quest ID là bắt buộc"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^QUEST_[A-Z0-9_]+$/, "Quest ID phải theo format: QUEST_XXX"],
      comment: "Mã định danh quest (VD: QUEST_MAIN_001, QUEST_SIDE_TEMPLE)",
    },
    title: {
      type: String,
      required: [true, "Tiêu đề quest là bắt buộc"],
      trim: true,
      maxlength: [150, "Tiêu đề không được vượt quá 150 ký tự"],
    },
    description: {
      type: String,
      required: [true, "Mô tả quest là bắt buộc"],
      trim: true,
      maxlength: [1000, "Mô tả không được vượt quá 1000 ký tự"],
    },
    story: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Câu chuyện không được vượt quá 2000 ký tự"],
      comment: "Nội dung lore/câu chuyện phía sau quest",
    },
    questLine: {
      type: String,
      required: true,
      enum: ["Main Story", "Side Quest", "Daily", "Weekly", "Event", "Tutorial"],
      default: "Side Quest",
      comment: "Loại chuỗi nhiệm vụ",
    },
    chapter: {
      type: String,
      default: null,
      comment: "Chapter/Arc của quest (VD: 'Chapter 1: The Awakening')",
    },
    prerequisites: [
      {
        type: String,
        comment: "Quest IDs cần hoàn thành trước (VD: ['QUEST_MAIN_001'])",
      },
    ],
    objectives: {
      type: [ObjectiveSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "Quest phải có ít nhất 1 objective",
      },
    },
    rewards: {
      type: RewardSchema,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard", "Expert", "Nightmare"],
      default: "Medium",
    },
    levelRequired: {
      type: Number,
      required: true,
      min: [1, "Level yêu cầu tối thiểu là 1"],
      default: 1,
    },
    timeLimit: {
      type: Number,
      default: null,
      min: 0,
      comment: "Giới hạn thời gian (giây). Null = không giới hạn",
    },
    isRepeatable: {
      type: Boolean,
      default: false,
      comment: "Quest có thể làm lại không (Daily/Weekly thường là true)",
    },
    cooldown: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Thời gian chờ để làm lại quest (giây). Chỉ dùng nếu isRepeatable = true",
    },
    isActive: {
      type: Boolean,
      default: true,
      comment: "Trạng thái kích hoạt của quest",
    },
    npcGiver: {
      type: String,
      default: null,
      comment: "NPC giao nhiệm vụ (VD: 'NPC_ELDER', 'NPC_PRIESTESS')",
    },
    location: {
      type: String,
      default: null,
      comment: "Vị trí nhận/nộp quest (VD: 'Village Center', 'Temple Gate')",
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "quests",
  }
);

// Indexes để tối ưu hóa truy vấn
QuestSchema.index({ questId: 1 }, { unique: true });
QuestSchema.index({ questLine: 1, isActive: 1 });
QuestSchema.index({ difficulty: 1 });
QuestSchema.index({ levelRequired: 1 });
QuestSchema.index({ isActive: 1 });
QuestSchema.index({ tags: 1 });

// Text search index
QuestSchema.index({ title: "text", description: "text" });

// Virtual để kiểm tra quest đã hoàn thành chưa
QuestSchema.virtual("isCompleted").get(function () {
  return this.objectives.every((obj) => obj.current >= obj.required);
});

// Virtual để tính progress percentage
QuestSchema.virtual("progressPercentage").get(function () {
  if (this.objectives.length === 0) return 0;
  
  const totalProgress = this.objectives.reduce((sum, obj) => {
    const objProgress = Math.min((obj.current / obj.required) * 100, 100);
    return sum + objProgress;
  }, 0);
  
  return Math.round(totalProgress / this.objectives.length);
});

// Ensure virtuals are included in JSON
QuestSchema.set("toJSON", { virtuals: true });
QuestSchema.set("toObject", { virtuals: true });

const Quest = mongoose.model("Quest", QuestSchema);

export default Quest;
