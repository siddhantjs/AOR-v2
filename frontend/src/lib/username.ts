const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsernameFormat(raw: string): { ok: true } | { ok: false; message: string } {
  const username = normalizeUsername(raw);

  if (!username) {
    return { ok: false, message: "Choose a username." };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      message: "3–20 characters: start with a letter; letters, numbers, underscore only.",
    };
  }
  return { ok: true };
}
