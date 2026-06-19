// Firebase SDK compat scripts import
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase client configuration
const firebaseConfig = {
  apiKey: "AIzaSyASXXWzR_nJOg1UQjUS63aKzlv4pcpN7ws",
  authDomain: "splendor-1ae02.firebaseapp.com",
  databaseURL: "https://splendor-1ae02-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "splendor-1ae02",
  storageBucket: "splendor-1ae02.firebasestorage.app",
  messagingSenderId: "1074726020772",
  appId: "1:1074726020772:web:194e205455062a69ace831"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle messages in background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'ახალი ჯავშანი! / New Booking!';
  const notificationOptions = {
    body: payload.notification?.body || 'ჯავშანი დაფიქსირდა სისტემაში.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
