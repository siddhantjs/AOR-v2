import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const libDir = path.dirname(fileURLToPath(import.meta.url));
/** `backend/scripts/` */
export const scriptsDir = path.resolve(libDir, "..");
/** `backend/` */
export const backendRoot = path.resolve(scriptsDir, "..");
/** Monorepo root (tracker-json, output JSON files). */
export const repoRoot = path.resolve(backendRoot, "..");

/**
 * Load env from backend, repo root, then frontend (first wins per key).
 */
export function loadEnvFiles() {
  const dirs = [backendRoot, repoRoot, path.join(repoRoot, "frontend")];
  for (const dir of dirs) {
    for (const file of [".env.local", ".env"]) {
      const envPath = path.join(dir, file);
      if (!fs.existsSync(envPath)) continue;
      for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;
        const eq = trimmed.indexOf("=");
        if (eq < 0) continue;
        const key = trimmed.slice(0, eq).trim();
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (process.env[key] == null) process.env[key] = val;
      }
    }
  }
}
