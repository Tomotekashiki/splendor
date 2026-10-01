export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  let dbInstance: any = null;

  const getDb = async () => {
    if (!dbInstance) {
      try {
        const { initializeApp, getApps, getApp } = await import('firebase/app');
        const { getDatabase } = await import('firebase/database');

        const firebaseConfig = {
          apiKey: config.public.firebaseApiKey,
          authDomain: config.public.firebaseAuthDomain,
          databaseURL: config.public.firebaseDatabaseUrl,
          projectId: config.public.firebaseProjectId,
          storageBucket: config.public.firebaseStorageBucket,
          messagingSenderId: config.public.firebaseMessagingSenderId,
          appId: config.public.firebaseAppId
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        dbInstance = getDatabase(app);
      } catch (err) {
        console.error("Lazy Firebase client initialization failed:", err);
      }
    }
    return dbInstance;
  };

  return {
    provide: {
      getDb,
      get db() {
        return dbInstance;
      }
    }
  };
});
