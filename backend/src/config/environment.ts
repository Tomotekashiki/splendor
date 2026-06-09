import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const preprocessBoolean = (val: any) => {
  if (typeof val === "string") {
    if (val.toLowerCase() === "false" || val === "0") return false;
    if (val.toLowerCase() === "true" || val === "1") return true;
  }
  return val;
};

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/splendor"),
  FIREBASE_DATABASE_URL: z.string().default("https://splendor-1ae02-default-rtdb.europe-west1.firebasedatabase.app/"),
  FIREBASE_API_KEY: z.string().default(process.env.FIREBASE_API_KEY || process.env.NUXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyASXXWzR_nJ0g1UQjUS63aKzlv4pcpN7ws"),
  FIREBASE_AUTH_DOMAIN: z.string().default(process.env.FIREBASE_AUTH_DOMAIN || process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "splendor-1ae02.firebaseapp.com"),
  FIREBASE_PROJECT_ID: z.string().default(process.env.FIREBASE_PROJECT_ID || process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || "splendor-1ae02"),
  FIREBASE_STORAGE_BUCKET: z.string().default(process.env.FIREBASE_STORAGE_BUCKET || process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "splendor-1ae02.firebasestorage.app"),
  FIREBASE_MESSAGING_SENDER_ID: z.string().default(process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1074726020772"),
  FIREBASE_APP_ID: z.string().default(process.env.FIREBASE_APP_ID || process.env.NUXT_PUBLIC_FIREBASE_APP_ID || "1:1074726020772:web:194e205455062a69ace831"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  WS_CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SMS_GATEWAY_API_KEY: z.string().default("mock_key"),
  SMS_SENDER_NAME: z.string().default("Splendor"),
  SMS_MOCK_MODE: z.preprocess(preprocessBoolean, z.boolean()).default(true),
  PAYMENT_API_KEY: z.string().default("mock_payment_key"),
  PAYMENT_MOCK_MODE: z.preprocess(preprocessBoolean, z.boolean()).default(true),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const originLower = origin.toLowerCase();
  
  // Allow localhost & 127.0.0.1 for development
  if (originLower.startsWith("http://localhost:") || 
      originLower.startsWith("http://127.0.0.1:") || 
      originLower.startsWith("https://localhost:") || 
      originLower.startsWith("https://127.0.0.1:")) {
    return true;
  }
  
  // Allow all Vercel deployments (including previews)
  if (originLower.endsWith(".vercel.app") || originLower.includes(".vercel.app")) {
    return true;
  }
  
  // Allow configured origins
  const configured = env.WS_CORS_ORIGIN.split(",").map(o => o.trim().toLowerCase());
  if (configured.includes(originLower) || configured.includes("*")) {
    return true;
  }
  
  return false;
}

