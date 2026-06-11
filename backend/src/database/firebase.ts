import fs from "fs";
import path from "path";
import { env } from "../config/environment.js";

// Client SDK Imports
import { initializeApp as initClientApp } from "firebase/app";
import { 
  getDatabase as getClientDb, 
  ref as clientRef, 
  set as clientSet, 
  get as clientGet, 
  remove as clientRemove, 
  update as clientUpdate, 
  push as clientPush, 
  runTransaction as clientRunTransaction 
} from "firebase/database";

// Resolve directories
const backendRoot = path.resolve(__dirname, "../../");
const serviceAccountPath = path.join(backendRoot, "firebase-service-account.json");

let useAdmin = false;
let adminDb: any = null;
let clientDb: any = null;

// Initialize connection
async function initDb() {
  const dbUrl = env.FIREBASE_DATABASE_URL;

  let serviceAccount: any = null;

  // 1. Try loading from environment variable
  if (env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      console.log("🔑 Found FIREBASE_SERVICE_ACCOUNT environment variable. Initializing Firebase Admin SDK...");
      serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    } catch (parseErr) {
      console.error("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON from env:", parseErr);
    }
  }

  // 2. Try loading from file fallback
  if (!serviceAccount && fs.existsSync(serviceAccountPath)) {
    try {
      console.log("🔑 Found service account file. Initializing Firebase Admin SDK...");
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    } catch (fileErr) {
      console.error("⚠️ Failed to read/parse service account file:", fileErr);
    }
  }

  if (serviceAccount) {
    try {
      console.log("🔑 Initializing Firebase Admin SDK with credentials...");
      const { default: admin } = await import("firebase-admin");
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: dbUrl,
      });
      adminDb = admin.database();
      useAdmin = true;
      console.log("🚀 Firebase Admin SDK initialized successfully.");
      return;
    } catch (adminErr) {
      console.error("⚠️ Failed to initialize Firebase Admin SDK. Trying client fallback...", adminErr);
    }
  }

  // Fallback to client SDK (Option B / Credential-free)
  console.log("🌐 Initializing Firebase Client SDK (Credential-free mode)...");
  const clientApp = initClientApp({
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    databaseURL: dbUrl,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
  });
  clientDb = getClientDb(clientApp);
  console.log("🚀 Firebase Client SDK initialized successfully.");
}

// Perform initial setup
initDb().catch((err) => {
  console.error("🔥 Fatal Error: Could not initialize any Firebase driver!", err);
});

// Helper operations
export const fb = {
  /**
   * Retrieves data at a path. Returns null if node doesn't exist.
   */
  async get(dbPath: string): Promise<any> {
    if (useAdmin) {
      const snapshot = await adminDb.ref(dbPath).once("value");
      return snapshot.val();
    } else {
      const snapshot = await clientGet(clientRef(clientDb, dbPath));
      return snapshot.val();
    }
  },

  /**
   * Overwrites data at a path.
   */
  async set(dbPath: string, data: any): Promise<void> {
    if (useAdmin) {
      await adminDb.ref(dbPath).set(data);
    } else {
      await clientSet(clientRef(clientDb, dbPath), data);
    }
  },

  /**
   * Updates fields at a path.
   */
  async update(dbPath: string, data: any): Promise<void> {
    if (useAdmin) {
      await adminDb.ref(dbPath).update(data);
    } else {
      await clientUpdate(clientRef(clientDb, dbPath), data);
    }
  },

  /**
   * Removes data at a path.
   */
  async remove(dbPath: string): Promise<void> {
    if (useAdmin) {
      await adminDb.ref(dbPath).remove();
    } else {
      await clientRemove(clientRef(clientDb, dbPath));
    }
  },

  /**
   * Generates a unique UUID and inserts a record. Returns the generated key/id.
   */
  async push(dbPath: string, data: any): Promise<string> {
    if (useAdmin) {
      const newRef = adminDb.ref(dbPath).push();
      const id = newRef.key;
      await newRef.set({ ...data, id });
      return id;
    } else {
      const newRef = clientPush(clientRef(clientDb, dbPath));
      const id = newRef.key;
      await clientSet(newRef, { ...data, id });
      return id;
    }
  },

  /**
   * Performs an atomic transaction on a path.
   * Note: The updateFn will receive the current data and should return the new data.
   */
  async transaction(dbPath: string, updateFn: (currentData: any) => any): Promise<{ committed: boolean; snapshot: any }> {
    if (useAdmin) {
      const result = await adminDb.ref(dbPath).transaction(updateFn);
      return {
        committed: result.committed,
        snapshot: result.snapshot,
      };
    } else {
      const result = await clientRunTransaction(clientRef(clientDb, dbPath), updateFn);
      return {
        committed: result.committed,
        snapshot: result.snapshot,
      };
    }
  }
};
