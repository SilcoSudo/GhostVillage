import mongoose from "mongoose";

const monsterSchema = new mongoose.Schema(
  {
    monsterId: { type: String, required: true, unique: true },
    monsterName: { type: String, required: true },
    monsterType: { type: String, enum: ["BOSS", "MINION"], required: true },
    prefabName: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    movementConfig: {
      moveSpeed: { type: Number, required: true, default: 3.5 },
      stoppingDistance: { type: Number, required: true, default: 0.5 },
      patrolRadius: { type: Number, required: true, default: 25 }, // <-- ĐÃ THÊM
    },
    combatConfig: {
      chaseRange: { type: Number, required: true, default: 25 },
      attackRange: { type: Number, required: true, default: 1.5 },
      attackCooldown: { type: Number, required: true, default: 1.0 },
      // <-- ĐÃ XÓA attackDamage
    },
    detectionConfig: {
      detectionRange: { type: Number, required: true, default: 15 },
      detectionAngle: { type: Number, required: true, default: 120 },
    },

    // Nơi chứa PullSkill của Ông Kẹ, hoặc ScreamSkill của Minion sau này
    specialSkillConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export default mongoose.model("Monster", monsterSchema);
