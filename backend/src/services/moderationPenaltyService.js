import UserModel from "../modules/user/userModel.js";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const getMuteDurationMsByViolationCount = (violationCount) => {
  if (violationCount <= 1) return 0;
  if (violationCount === 2) return 1 * 60 * 60 * 1000;
  if (violationCount === 3) return 24 * 60 * 60 * 1000;
  if (violationCount === 4) return 3 * 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isAIViolation = (aiModeration) => {
  const label = String(aiModeration?.label || "no_violation").toLowerCase();
  return label !== "no_violation";
};

export const applyProgressiveModerationPenalty = async ({
  userId,
  now = new Date(),
}) => {
  if (!userId) {
    return {
      applied: false,
      reason: "missing_user_id",
    };
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return {
      applied: false,
      reason: "user_not_found",
    };
  }

  const moderation = user.moderation || {};
  const currentViolationCount = Math.max(
    Number(moderation.violationCount) || 0,
    0,
  );
  const lastViolationAt = toDate(moderation.lastViolationAt);

  let mergedWindow = false;
  let resetApplied = false;
  let nextViolationCount = 1;

  if (lastViolationAt) {
    const elapsedMs = now.getTime() - lastViolationAt.getTime();

    if (elapsedMs < THIRTY_MINUTES_MS) {
      mergedWindow = true;
      nextViolationCount = Math.max(currentViolationCount, 1);
    } else if (elapsedMs > THIRTY_DAYS_MS) {
      resetApplied = currentViolationCount > 0;
      nextViolationCount = 1;
    } else {
      nextViolationCount = currentViolationCount + 1;
    }
  }

  const muteDurationMs = mergedWindow
    ? 0
    : getMuteDurationMsByViolationCount(nextViolationCount);

  const activeMutedUntil = toDate(moderation.mutedUntil);
  const hasActiveMute = activeMutedUntil && activeMutedUntil > now;

  let mutedUntil = hasActiveMute ? activeMutedUntil : null;
  if (muteDurationMs > 0) {
    const calculatedMutedUntil = new Date(now.getTime() + muteDurationMs);
    if (!mutedUntil || calculatedMutedUntil > mutedUntil) {
      mutedUntil = calculatedMutedUntil;
    }
  }

  const penaltyType = mergedWindow
    ? "merged_hide_only"
    : muteDurationMs > 0
      ? "mute"
      : "warning";

  user.moderation = {
    violationCount: nextViolationCount,
    lastViolationAt: now,
    mutedUntil,
    lastAction: penaltyType,
    lastActionAt: now,
  };
  user.isMute = Boolean(mutedUntil && mutedUntil > now);

  await user.save();

  return {
    applied: true,
    userId: String(user._id),
    mergedWindow,
    resetApplied,
    violationCount: nextViolationCount,
    penaltyType,
    lockSeconds: Math.floor(muteDurationMs / 1000),
    mutedUntil,
    isMuted: user.isMute,
  };
};

export const getUserPostingRestriction = async ({
  userId,
  now = new Date(),
}) => {
  if (!userId) {
    return {
      allowed: false,
      reason: "missing_user_id",
      statusCode: 401,
      message: "Not authorized, no user",
    };
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return {
      allowed: false,
      reason: "user_not_found",
      statusCode: 401,
      message: "Not authorized, user not found",
    };
  }

  const mutedUntil = toDate(user?.moderation?.mutedUntil);
  if (mutedUntil && mutedUntil > now) {
    if (!user.isMute) {
      user.isMute = true;
      await user.save();
    }

    return {
      allowed: false,
      reason: "muted",
      statusCode: 403,
      message: "You are temporarily blocked from posting/commenting",
      mutedUntil,
      remainingSeconds: Math.max(
        1,
        Math.ceil((mutedUntil.getTime() - now.getTime()) / 1000),
      ),
    };
  }

  let shouldSave = false;
  if (user.isMute) {
    user.isMute = false;
    shouldSave = true;
  }

  if (user?.moderation?.mutedUntil) {
    user.moderation.mutedUntil = null;
    shouldSave = true;
  }

  if (shouldSave) {
    await user.save();
  }

  return {
    allowed: true,
    reason: "allowed",
  };
};
