import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    databaseURL: config.public.firebaseDatabaseUrl,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId
  };

  // If app is already initialized, use it, otherwise initialize a new one
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getDatabase(app);

  return {
    provide: {
      db // Exposes database as $db in components
    }
  };
});

