const fs = require("fs");
const path = require("path");

const serviceAccountPath = path.resolve(__dirname, "../../firebase-service-account.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Service account file not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
const dbUrl = "https://splendor-1ae02-default-rtdb.europe-west1.firebasedatabase.app";

async function run() {
  console.log("🔑 Initializing Firebase Admin SDK...");
  const admin = require("firebase-admin");
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: dbUrl,
  });
  
  const db = admin.database();
  console.log("🔍 Fetching admin_fcm_tokens node...");
  
  try {
    const snap = await db.ref("admin_fcm_tokens").once("value");
    const val = snap.val();
    if (val) {
      console.log("✅ Registered Admin FCM Tokens:");
      console.log(JSON.stringify(val, null, 2));
    } else {
      console.log("⚠️ No FCM tokens found in the database. Node 'admin_fcm_tokens' is empty or doesn't exist.");
    }
  } catch (err) {
    console.error("❌ Database query failed:", err);
  }
  process.exit(0);
}

run();
