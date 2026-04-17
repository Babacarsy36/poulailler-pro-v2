import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import { AuthProvider } from "./AuthContext";

export default function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.log('Main SW registration failed: ', err);
        });
        navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(err => {
          console.log('FCM SW registration failed: ', err);
        });
      });
    }
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}
