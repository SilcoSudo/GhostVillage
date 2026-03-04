import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_RESULT = {
  isValidReport: false,
  label: "no_violation",
  confidence: 0,
  reason: "AI moderation is unavailable.",
  evidence: [],
  recommendedAction: "escalate_human",
};

const VALID_LABELS = new Set([
  "spam",
  "scam",
  "abuse",
  "adult",
  "misinfo",
  "no_violation",
]);

const VALID_ACTIONS = new Set([
  "keep",
  "warn",
  "hide_temp",
  "remove",
  "escalate_human",
]);

const DEFAULT_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
];

const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;
let modelCache = {
  fetchedAt: 0,
  models: [],
};

const normalizeModelName = (name) =>
  String(name || "").replace(/^models\//, "");

const unique = (items) => {
  return Array.from(new Set(items.filter(Boolean)));
};

const getPreferredModelOrder = (items) => {
  const scored = items.map((model) => {
    let score = 0;
    if (/2\.5.*flash/i.test(model)) score += 100;
    if (/2\.0.*flash/i.test(model)) score += 90;
    if (/1\.5.*flash/i.test(model)) score += 80;
    if (/1\.5.*pro/i.test(model)) score += 70;
    if (/flash-lite/i.test(model)) score -= 5;
    if (/preview|exp/i.test(model)) score -= 10;
    return { model, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((item) => item.model);
};

const fetchAvailableModels = async (apiKey) => {
  const now = Date.now();
  if (
    modelCache.models.length > 0 &&
    now - modelCache.fetchedAt < MODEL_CACHE_TTL_MS
  ) {
    return modelCache.models;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
  );

  if (!response.ok) {
    throw new Error(`ListModels failed with status ${response.status}`);
  }

  const payload = await response.json();
  const models = Array.isArray(payload?.models) ? payload.models : [];
  const usable = models
    .filter((item) =>
      Array.isArray(item?.supportedGenerationMethods)
        ? item.supportedGenerationMethods.includes("generateContent")
        : false,
    )
    .map((item) => normalizeModelName(item?.name))
    .filter(Boolean);

  modelCache = {
    fetchedAt: now,
    models: getPreferredModelOrder(unique(usable)),
  };

  return modelCache.models;
};

const buildPrompt = ({ postText, reportReason, reportCountUniqueUsers }) => {
  return [
    "You are an AI moderator for a game forum.",
    "Task: evaluate whether a user report is valid based on rules.",
    "Return ONLY valid JSON. No markdown. No extra text.",
    "",
    "RULES:",
    "- spam: repeated ads, meaningless repeated links.",
    "- scam: fraud, phishing, asking users to transfer money suspiciously.",
    "- abuse: hate speech, harassment, threats, toxic insults.",
    "- adult: explicit sexual/adult content.",
    "- misinfo: harmful misinformation likely to cause damage.",
    "- no_violation: not violating any rule.",
    "",
    "OUTPUT JSON SCHEMA:",
    "{",
    '  "is_valid_report": true,',
    '  "label": "spam|scam|abuse|adult|misinfo|no_violation",',
    '  "confidence": 0.0,',
    '  "reason": "short explanation",',
    '  "evidence": ["snippet 1", "snippet 2"],',
    '  "recommended_action": "keep|warn|hide_temp|remove|escalate_human"',
    "}",
    "",
    "INPUT:",
    `post_text: ${JSON.stringify(postText || "")}`,
    `report_reason: ${JSON.stringify(reportReason || "")}`,
    `report_count_unique_users: ${Number(reportCountUniqueUsers) || 1}`,
  ].join("\n");
};

const normalizeResponse = (raw) => {
  const isValidReport = Boolean(raw?.is_valid_report ?? raw?.isValidReport);
  const label = String(raw?.label || "no_violation").toLowerCase();
  const confidence = Number(raw?.confidence);
  const reason = String(raw?.reason || "No reason provided by AI.");
  const evidence = Array.isArray(raw?.evidence)
    ? raw.evidence.map((item) => String(item)).slice(0, 5)
    : [];
  const recommendedAction = String(
    raw?.recommended_action || raw?.recommendedAction || "escalate_human",
  ).toLowerCase();

  const normalizedLabel = VALID_LABELS.has(label) ? label : "no_violation";
  let normalizedAction = VALID_ACTIONS.has(recommendedAction)
    ? recommendedAction
    : "escalate_human";

  if (normalizedLabel === "no_violation") {
    normalizedAction = "keep";
  }

  return {
    isValidReport: normalizedLabel === "no_violation" ? false : isValidReport,
    label: normalizedLabel,
    confidence:
      Number.isFinite(confidence) && confidence >= 0 && confidence <= 1
        ? confidence
        : 0,
    reason,
    evidence,
    recommendedAction: normalizedAction,
  };
};

const extractJson = (text) => {
  if (!text || typeof text !== "string") return null;

  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
};

export const evaluateReportWithGemini = async ({
  postText,
  reportReason,
  reportCountUniqueUsers,
}) => {
  const isEnabled = String(process.env.AI_MODERATION_ENABLED || "false")
    .toLowerCase()
    .trim();
  const provider = String(process.env.AI_PROVIDER || "")
    .toLowerCase()
    .trim();

  if (isEnabled !== "true" || provider !== "gemini") {
    return {
      ...DEFAULT_RESULT,
      reason: "AI moderation is disabled or provider is not gemini.",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = String(process.env.GEMINI_MODEL || "").trim();

  if (!apiKey) {
    return {
      ...DEFAULT_RESULT,
      reason: "Missing GEMINI_API_KEY.",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildPrompt({
      postText,
      reportReason,
      reportCountUniqueUsers,
    });

    let discoveredModels = [];
    try {
      discoveredModels = await fetchAvailableModels(apiKey);
    } catch {
      discoveredModels = [];
    }

    const preferredCandidates = modelName
      ? [
          modelName,
          ...DEFAULT_MODEL_CANDIDATES.filter((item) => item !== modelName),
        ]
      : DEFAULT_MODEL_CANDIDATES;

    const modelCandidates = unique([
      ...preferredCandidates.map(normalizeModelName),
      ...discoveredModels.map(normalizeModelName),
    ]);

    let parsed = null;
    let lastError = null;

    for (const candidate of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: candidate });
        const response = await model.generateContent(prompt);
        const responseText = response?.response?.text?.() || "";
        parsed = extractJson(responseText);
        if (parsed) break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!parsed) {
      return {
        ...DEFAULT_RESULT,
        reason: lastError?.message
          ? `Gemini request failed: ${lastError.message}`
          : "Failed to parse AI response.",
      };
    }

    const normalized = normalizeResponse(parsed);
    return normalized;
  } catch (error) {
    return {
      ...DEFAULT_RESULT,
      reason: `Gemini request failed: ${error?.message || "unknown error"}`,
    };
  }
};
