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

  if (notificationChannels.has(userId)) {
    return notificationChannels.get(userId);
  }

  try {
    notificationListeners.set(userId, onNotification);
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
            const listener = notificationListeners.get(userId);
            if (listener && typeof listener === "function") {
              listener(payload.new);
            }
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
export const unsubscribeFromNotifications = async (userId) => {
  try {
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

/**
 * Get the current Supabase client
 * @returns {Object|null} Supabase client or null
 */
export const getSupabaseClient = () => {
  return supabaseClient;
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
  getSupabaseClient,
};