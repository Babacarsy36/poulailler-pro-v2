importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCKTs0HDIsrep_8xKvLqHBSiyy79GvaD2k",
  authDomain: "poulaillerpro.firebaseapp.com",
  projectId: "poulaillerpro",
  storageBucket: "poulaillerpro.firebasestorage.app",
  messagingSenderId: "1094152963862",
  appId: "1:1094152963862:web:f76e1a89cd28dc66953237"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
