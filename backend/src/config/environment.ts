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
