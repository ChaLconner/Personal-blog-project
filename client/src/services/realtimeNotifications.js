import { supabaseClient } from "../lib/supabaseClient.js";

const notificationChannels = new Map();
const notificationListeners = new Map();

/**
 * Subscribe to real-time notifications for a user
 * @param {string} userId - User ID to subscribe to notifications for
 * @param {Function} onNotification - Callback function when notification is received
 * @returns {Promise<Object>} Subscription object or null if failed
 */
export const subscribeToNotifications = async (userId, onNotification) => {
  if (!supabaseClient) {
    return null;
  }

  if (!userId) {
    return null;
  }

  if (typeof onNotification === "function") {
    if (!notificationListeners.has(userId)) {
      notificationListeners.set(userId, []);
    }
    notificationListeners.get(userId).push(onNotification);
  }

  if (notificationChannels.has(userId)) {
    return notificationChannels.get(userId);
  }

  try {
    const channel = supabaseClient
      .channel(`notifications_user_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          try {
            const listeners = notificationListeners.get(userId) || [];
            listeners.forEach((listener) => {
              try {
                listener(payload.new);
              } catch {
                // Silently handle error for individual listener
              }
            });
          } catch {
            // Silently handle errors in notification handler
          }
        }
      )
      .subscribe(() => {
        // Handle subscription status silently
      });

    notificationChannels.set(userId, channel);

    return channel;
  } catch {
    // Silently handle subscription errors
    return null;
  }
};

/**
 * Unsubscribe from real-time notifications for a user
 * @param {string} userId - User ID to unsubscribe from
 * @returns {Promise<boolean>} Success status
 */
export const unsubscribeFromNotifications = async (userId, listenerToRemove) => {
  try {
    if (listenerToRemove) {
      const listeners = notificationListeners.get(userId);
      if (listeners) {
        const filtered = listeners.filter(l => l !== listenerToRemove);
        if (filtered.length > 0) {
          notificationListeners.set(userId, filtered);
          return true; // Still have other listeners, keep channel
        }
      }
    }
    
    const channel = notificationChannels.get(userId);
    if (!channel || !supabaseClient) {
      return false;
    }

    await supabaseClient.removeChannel(channel);
    notificationChannels.delete(userId);
    notificationListeners.delete(userId);
    
    return true;
  } catch {
    // Silently handle unsubscription errors
    return false;
  }
};

/**
 * Check if user is subscribed to notifications
 * @param {string} userId - User ID to check
 * @returns {boolean} Subscription status
 */
export const isSubscribedToNotifications = (userId) => {
  return notificationChannels.has(userId);
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    notificationChannels.forEach(async (channel) => {
      try {
        if (supabaseClient) {
          await supabaseClient.removeChannel(channel);
        }
      } catch {
        // Silently handle cleanup errors
      }
    });
    notificationChannels.clear();
    notificationListeners.clear();
  });
}

export default {
  subscribeToNotifications,
  unsubscribeFromNotifications,
  isSubscribedToNotifications,
};