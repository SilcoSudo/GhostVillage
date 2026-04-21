const normalizeNotificationType = (type) =>
  String(type || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getActorName = (notification, t) => {
  const fallbackName = t("notifications.items.default.actor", {
    defaultValue: "Someone",
  });

  return (
    notification?.i18n?.messageParams?.name ||
    notification?.i18n?.messageParams?.moderatorName ||
    notification?.relatedUser?.fullname ||
    notification?.relatedUser?.username ||
    notification?.relatedUser?.email ||
    notification?.actorName ||
    fallbackName
  );
};

const translateEntityType = (t, value) => {
  if (!value) return value;

  const normalized = String(value).toLowerCase();
  const translated = t(`notifications.entityTypes.${normalized}`, {
    defaultValue: normalized,
  });

  return translated === `notifications.entityTypes.${normalized}`
    ? normalized
    : translated;
};

const formatModerationDuration = (durationSeconds, language) => {
  const seconds = Math.max(0, Math.ceil(Number(durationSeconds) || 0));
  if (seconds <= 0) return "";

  const isVietnamese = String(language || "")
    .toLowerCase()
    .startsWith("vi");
  const hours = Math.max(1, Math.ceil(seconds / 3600));

  if (isVietnamese) {
    return `${hours} giờ`;
  }

  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
};

const translateParams = (t, params = {}, notification, language) => {
  const mergedParams = { ...params };

  if (!mergedParams.name) {
    mergedParams.name = getActorName(notification, t);
  }

  if (mergedParams.entityType) {
    mergedParams.entityType = translateEntityType(t, mergedParams.entityType);
  }

  if (
    mergedParams.duration == null &&
    mergedParams.durationSeconds != null &&
    Number.isFinite(Number(mergedParams.durationSeconds))
  ) {
    mergedParams.duration = formatModerationDuration(
      mergedParams.durationSeconds,
      language,
    );
  }

  return mergedParams;
};

const translateWithFallback = (t, key, params = {}, fallback = "") => {
  if (!key) return fallback;

  const translated = t(key, {
    ...params,
    defaultValue: fallback,
  });

  return translated === key ? fallback : translated;
};

const hasUnresolvedPlaceholder = (value) =>
  /\{\{[^}]+\}\}/.test(String(value || ""));

const getContextLines = (notification, t) => {
  const contextItems = Array.isArray(notification?.context)
    ? notification.context
    : [];

  return contextItems
    .map((item) => {
      const value = String(item?.value || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!value) {
        return null;
      }

      const label = item?.labelKey
        ? t(item.labelKey, { defaultValue: item?.label || "" })
        : String(item?.label || "").trim();

      return {
        label: label && label !== item.labelKey ? label : "",
        value,
      };
    })
    .filter(Boolean);
};

const formatContextSummary = (contextLines) =>
  contextLines
    .map((line) => (line.label ? `${line.label}: ${line.value}` : line.value))
    .join(" · ");

const getNotificationTextFromKeys = (notification, t, language) => {
  const titleKey = notification?.i18n?.titleKey;
  const messageKey = notification?.i18n?.messageKey;
  const titleParams = translateParams(
    t,
    notification?.i18n?.titleParams || {},
    notification,
    language,
  );
  const messageParams = translateParams(
    t,
    notification?.i18n?.messageParams || {},
    notification,
    language,
  );

  const title = translateWithFallback(
    t,
    titleKey,
    titleParams,
    notification?.title || "",
  );
  const translatedMessage = translateWithFallback(
    t,
    messageKey,
    messageParams,
    notification?.message || "",
  );

  return {
    title,
    message:
      hasUnresolvedPlaceholder(translatedMessage) && notification?.message
        ? notification.message
        : translatedMessage,
  };
};

const getNotificationTextByType = (notification, t) => {
  const type = normalizeNotificationType(notification?.type);
  const actorName = getActorName(notification, t);

  switch (type) {
    case "friend_request":
      return {
        title: t("notifications.items.friendRequest.title", {
          defaultValue: notification?.title || "",
        }),
        message: t("notifications.items.friendRequest.message", {
          name: actorName,
          defaultValue: notification?.message || "",
        }),
      };
    case "friend_accepted":
      return {
        title: t("notifications.items.friendAccepted.title", {
          defaultValue: notification?.title || "",
        }),
        message: t("notifications.items.friendAccepted.message", {
          name: actorName,
          defaultValue: notification?.message || "",
        }),
      };
    case "friend_rejected":
      return {
        title: t("notifications.items.friendRejected.title", {
          defaultValue: notification?.title || "",
        }),
        message: t("notifications.items.friendRejected.message", {
          name: actorName,
          defaultValue: notification?.message || "",
        }),
      };
    case "post_liked":
      return {
        title: t("notifications.items.postLiked.title", {
          defaultValue: notification?.title || "",
        }),
        message: t("notifications.items.postLiked.message", {
          name: actorName,
          defaultValue: notification?.message || "",
        }),
      };
    case "post_commented":
      return {
        title: t("notifications.items.postCommented.title", {
          defaultValue: notification?.title || "",
        }),
        message: t("notifications.items.postCommented.message", {
          name: actorName,
          defaultValue: notification?.message || "",
        }),
      };
    case "comment_replied":
      return {
        title: t("notifications.items.commentReplied.title", {
          defaultValue: notification?.title || "",
        }),
        message: t("notifications.items.commentReplied.message", {
          name: actorName,
          defaultValue: notification?.message || "",
        }),
      };
    case "ticket_replied":
      return {
        title: t("notifications.items.ticketReplied.title", {
          defaultValue: notification?.title || "",
        }),
        message: t("notifications.items.ticketReplied.message", {
          name: actorName,
          subject: notification?.i18n?.messageParams?.subject || "",
          defaultValue: notification?.message || "",
        }),
      };
    case "report_processed":
      return getNotificationTextFromKeys(notification, t);
    case "announcement":
      return {
        title:
          notification?.title ||
          t("notifications.items.default.title", {
            defaultValue: "Notification",
          }),
        message:
          notification?.message ||
          t("notifications.items.default.message", {
            defaultValue: "You have a new notification.",
          }),
      };
    default:
      return {
        title:
          notification?.title ||
          t("notifications.items.default.title", {
            defaultValue: "Notification",
          }),
        message:
          notification?.message ||
          t("notifications.items.default.message", {
            defaultValue: "You have a new notification.",
          }),
      };
  }
};

export const getLocalizedNotificationText = (notification, t, language) => {
  const contextLines = getContextLines(notification, t);

  if (notification?.i18n?.titleKey || notification?.i18n?.messageKey) {
    const base = getNotificationTextFromKeys(notification, t, language);
    return {
      ...base,
      contextLines,
      contextSummary: formatContextSummary(contextLines),
    };
  }

  const base = getNotificationTextByType(notification, t);
  return {
    ...base,
    contextLines,
    contextSummary: formatContextSummary(contextLines),
  };
};

export const getLocalizedNotificationToastText = (
  notification,
  t,
  language,
) => {
  const { message, contextSummary } = getLocalizedNotificationText(
    notification,
    t,
    language,
  );

  return contextSummary ? `${message} · ${contextSummary}` : message;
};
