import type { MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { users, sessions } from "../shared/schema.d1";
import { eq } from "drizzle-orm";
import { getDb, type DB } from "./db";
import type { Env } from "./types";
import type { User } from "../shared/schema.d1";

export type Variables = {
  userId: string;
  user: User;
  db: DB;
};

export type HonoEnv = {
  Bindings: Env;
  Variables: Variables;
};

// ── Password hashing (PBKDF2 via Web Crypto) ─────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 }, keyMat, 256);
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 }, keyMat, 256);
  const testHex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return testHex === hashHex;
}

// ── Session management ────────────────────────────────────────────────────────

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export async function createSession(db: DB, userId: string): Promise<string> {
  const sid = crypto.randomUUID();
  const expire = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ sid, sess: { userId } as any, expire });
  return sid;
}

export async function resolveSession(db: DB, sid: string): Promise<{ userId: string } | null> {
  const [row] = await db.select().from(sessions).where(eq(sessions.sid, sid));
  if (!row) return null;
  // expire is stored as integer timestamp (seconds), Drizzle returns a Date
  if ((row.expire as unknown as Date) < new Date()) {
    await db.delete(sessions).where(eq(sessions.sid, sid));
    return null;
  }
  const data = typeof row.sess === "string" ? JSON.parse(row.sess) : row.sess;
  return data as { userId: string };
}

export async function deleteSession(db: DB, sid: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sid, sid));
}

// ── Auth middleware ───────────────────────────────────────────────────────────

export const injectDb: MiddlewareHandler<HonoEnv> = async (c, next) => {
  c.set("db", getDb(c.env));
  return next();
};

export const isAuthenticated: MiddlewareHandler<HonoEnv> = async (c, next) => {
  let sid = getCookie(c, "session");
  if (!sid) {
    const auth = c.req.header("authorization");
    if (auth?.startsWith("Bearer ")) sid = auth.slice(7);
  }
  if (!sid) return c.json({ message: "Unauthorized" }, 401);

  const db = c.get("db");
  const sessionData = await resolveSession(db, sid);
  if (!sessionData) return c.json({ message: "Unauthorized" }, 401);

  const [user] = await db.select().from(users).where(eq(users.id, sessionData.userId));
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  c.set("userId", user.id);
  c.set("user", user);
  return next();
};

// ── Auth route handlers (used in index.ts) ───────────────────────────────────

export async function handleRegister(c: any): Promise<Response> {
  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return c.json({ error: "email and password are required" }, 400);
  }
  const db: DB = c.get("db");
  const email = String(body.email).toLowerCase().trim();

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return c.json({ error: "Email already registered" }, 409);

  const passwordHash = await hashPassword(String(body.password));
  const id = crypto.randomUUID();
  const [user] = await db
    .insert(users)
    .values({ id, email, firstName: body.firstName || null, passwordHash })
    .returning();

  const sid = await createSession(db, user.id);
  setCookie(c, "session", sid, { httpOnly: true, secure: true, path: "/", maxAge: SESSION_TTL_MS / 1000, sameSite: "None" });
  const { passwordHash: _, ...safe } = user;
  return c.json({ ...safe, _sid: sid }, 201);
}

export async function handleLogin(c: any): Promise<Response> {
  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return c.json({ error: "email and password are required" }, 400);
  }
  const db: DB = c.get("db");
  const email = String(body.email).toLowerCase().trim();

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !user.passwordHash) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await verifyPassword(String(body.password), user.passwordHash);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  const sid = await createSession(db, user.id);
  setCookie(c, "session", sid, { httpOnly: true, secure: true, path: "/", maxAge: SESSION_TTL_MS / 1000, sameSite: "None" });
  const { passwordHash: _, ...safe } = user;
  return c.json({ ...safe, _sid: sid });
}

export async function handleLogout(c: any): Promise<Response> {
  let sid = getCookie(c, "session");
  if (!sid) {
    const auth = c.req.header("authorization");
    if (auth?.startsWith("Bearer ")) sid = auth.slice(7);
  }
  if (sid) {
    const db: DB = c.get("db");
    await deleteSession(db, sid);
  }
  deleteCookie(c, "session", { path: "/" });
  return c.json({ ok: true });
}

export async function handleGetUser(c: any): Promise<Response> {
  const user = c.get("user") as User;
  const { passwordHash: _, ...safe } = user;
  return c.json(safe);
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export async function handleGoogleOAuth(c: any): Promise<Response> {
  const state = crypto.randomUUID();
  const origin = new URL(c.req.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: true,
    path: "/api/auth",
    maxAge: 300,
    sameSite: "Lax",
  });

  return c.redirect(`${GOOGLE_AUTH_URL}?${params}`);
}

export async function handleGoogleCallback(c: any): Promise<Response> {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  const cookieState = getCookie(c, "oauth_state");
  deleteCookie(c, "oauth_state", { path: "/api/auth" });

  if (error) {
    return c.redirect(`/?_auth_error=${encodeURIComponent(String(error))}`);
  }
  if (!code || !state || state !== cookieState) {
    return c.redirect("/?_auth_error=invalid_state");
  }

  const origin = new URL(c.req.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return c.redirect("/?_auth_error=token_exchange_failed");
    }

    const tokens = (await tokenRes.json()) as { access_token: string };

    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return c.redirect("/?_auth_error=userinfo_failed");
    }

    const googleUser = (await userInfoRes.json()) as {
      email?: string;
      given_name?: string;
      picture?: string;
    };

    if (!googleUser.email) {
      return c.redirect("/?_auth_error=no_email");
    }

    const db: DB = c.get("db");
    const email = googleUser.email.toLowerCase();

    let [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      const id = crypto.randomUUID();
      [user] = await db
        .insert(users)
        .values({ id, email, firstName: googleUser.given_name ?? null, profileImageUrl: googleUser.picture ?? null })
        .returning();
    } else if (googleUser.picture && !user.profileImageUrl) {
      await db.update(users).set({ profileImageUrl: googleUser.picture }).where(eq(users.id, user.id));
    }

    const sid = await createSession(db, user.id);
    setCookie(c, "session", sid, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
      sameSite: "None",
    });

    return c.redirect(`/?_sid=${sid}`);
  } catch {
    return c.redirect("/?_auth_error=unexpected");
  }
}
