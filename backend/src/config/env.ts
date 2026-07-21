import "dotenv/config";

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN?.trim() || "http://localhost:3000",
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME?.trim() || "aor-v2",
  geminiApiKey: process.env.GEMINI_API_KEY,
};

export function assertMongoConfigured(): void {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not set");
  }
}

export { required };
