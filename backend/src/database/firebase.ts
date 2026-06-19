import fs from "fs";
import path from "path";
import crypto from "crypto";
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
let useLocalMock = false;
let adminDb: any = null;
let clientDb: any = null;

// Local JSON Database Mock Implementation
let localDbData: any = {};
const mockDbPath = path.join(backendRoot, "db-mock.json");

function loadLocalDb() {
  if (fs.existsSync(mockDbPath)) {
    try {
      localDbData = JSON.parse(fs.readFileSync(mockDbPath, "utf-8"));
    } catch (e) {
      console.error("Error reading db-mock.json, starting empty:", e);
      localDbData = {};
    }
  } else {
    localDbData = {};
  }
}

function saveLocalDb() {
  try {
    fs.writeFileSync(mockDbPath, JSON.stringify(localDbData, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing db-mock.json:", e);
  }
}

function getParts(dbPath: string): string[] {
  return dbPath.split("/").filter(p => p.length > 0);
}

function localGet(dbPath: string): any {
  loadLocalDb();
  const parts = getParts(dbPath);
  let current = localDbData;
  for (const part of parts) {
    if (current === null || typeof current !== "object") {
      return null;
    }
    current = current[part];
  }
  return current !== undefined ? JSON.parse(JSON.stringify(current)) : null;
}

function localSet(dbPath: string, data: any): void {
  loadLocalDb();
  const parts = getParts(dbPath);
  if (parts.length === 0) {
    localDbData = JSON.parse(JSON.stringify(data));
    saveLocalDb();
    return;
  }
  let current = localDbData;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = JSON.parse(JSON.stringify(data));
  saveLocalDb();
}

function localUpdate(dbPath: string, data: any): void {
  loadLocalDb();
  const parts = getParts(dbPath);
  if (parts.length === 0) {
    if (data && typeof data === "object") {
      Object.assign(localDbData, JSON.parse(JSON.stringify(data)));
      saveLocalDb();
    }
    return;
  }
  let current = localDbData;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  const lastKey = parts[parts.length - 1];
  if (current[lastKey] === undefined || current[lastKey] === null || typeof current[lastKey] !== "object") {
    current[lastKey] = {};
  }
  Object.assign(current[lastKey], JSON.parse(JSON.stringify(data)));
  saveLocalDb();
}

function localRemove(dbPath: string): void {
  loadLocalDb();
  const parts = getParts(dbPath);
  if (parts.length === 0) {
    localDbData = {};
    saveLocalDb();
    return;
  }
  let current = localDbData;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null || typeof current[part] !== "object") {
      return;
    }
    current = current[part];
  }
  delete current[parts[parts.length - 1]];
  saveLocalDb();
}

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

  // Fallback to local JSON mock database
  console.log("⚠️ No Firebase Service Account credentials found. Falling back to local JSON database (db-mock.json)...");
  useLocalMock = true;
  loadLocalDb();
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
    } else if (useLocalMock) {
      return localGet(dbPath);
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
    } else if (useLocalMock) {
      localSet(dbPath, data);
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
    } else if (useLocalMock) {
      localUpdate(dbPath, data);
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
    } else if (useLocalMock) {
      localRemove(dbPath);
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
    } else if (useLocalMock) {
      const id = crypto.randomUUID();
      localSet(`${dbPath}/${id}`, { ...data, id });
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
    } else if (useLocalMock) {
      const current = localGet(dbPath);
      const updated = updateFn(current);
      localSet(dbPath, updated);
      return {
        committed: true,
        snapshot: {
          val: () => updated,
        },
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
