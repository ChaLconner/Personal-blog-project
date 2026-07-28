const COMMENT_NOTIFICATION_TYPES = new Set([
  "comment",
  "new_comment",
  "comment_reply",
  "reply",
]);

export const getNotificationPresentation = (type) => {
  if (COMMENT_NOTIFICATION_TYPES.has(type)) {
    return {
      actionText: "Commented on your article:",
      showMessage: true,
    };
  }

  if (type === "like") {
    return {
      actionText: "liked your article:",
      showMessage: false,
    };
  }

  if (type === "new_article") {
    return {
      actionText: "published a new article:",
      showMessage: false,
    };
  }

  return {
    actionText: "sent a notification about:",
    showMessage: false,
  };
};
