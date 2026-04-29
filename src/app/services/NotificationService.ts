import { getToken, onMessage } from "firebase/messaging";
import { messaging, db } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";

const VAPID_KEY = "BIOkfoeZgQu4fRa0G7JVsuVmWwAyjsG6vv9hJF05M6GpqwZK5i9jcSFYydR5hsPcDrs9GxBcg1br4cTuQeAiVgo";

export const NotificationService = {
  async requestPermission(userId: string) {
    if (!messaging) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          if (import.meta.env.DEV) {
            console.log("[DEV] FCM Token:", token);
          }
          await this.saveTokenToFirestore(userId, token);
          return token;
        }
      } else {
        console.log("Notification permission denied");
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
  },

  async saveTokenToFirestore(userId: string, token: string) {
    try {
      if (!userId) return;
      const userRef = doc(db, "users", userId, "settings", "profile");
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token)
      });
    } catch (error) {
      console.error("Error saving FCM token to Firestore:", error);
    }
  },

  showLocalNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/favicon.png'
      });
    }
  },

  initForegroundListener() {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      this.showLocalNotification(
        payload.notification?.title || "Notification",
        payload.notification?.body || ""
      );
      toast(payload.notification?.title || "Notification", {
        description: payload.notification?.body,
        icon: "🔔"
      });
    });
  }
};
