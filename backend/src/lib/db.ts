import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
/** Logical DB name. Prefer env; never rely on Atlas URI path alone (often omitted). */
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME?.trim() || "aor-v2";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export function getDbName(): string {
  return MONGODB_DB_NAME;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
