import dotenv from "dotenv";

dotenv.config();

const readRequired = (key, fallbackKey) => {
  const value = process.env[key] || (fallbackKey ? process.env[fallbackKey] : undefined);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const parseOrigins = (value) => {
  if (!value || value.trim() === "*") return ["*"];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 10000),
  supabaseUrl: readRequired("SUPABASE_URL"),
  supabasePublishableKey: readRequired("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: readRequired("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"),
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
};
