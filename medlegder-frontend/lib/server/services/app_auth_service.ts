import crypto from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../repositories/db";
import { app_identities } from "../repositories/schema";
import type { IdentityRole } from "../../shared/identity_id";

const PASSWORD_ITERATIONS = 210000;
const PASSWORD_KEYLEN = 32;
const PASSWORD_DIGEST = "sha256";

let ensureSchemaPromise: Promise<void> | null = null;

const ensureAuthSchema = () => {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_identities (
        user_id text PRIMARY KEY NOT NULL,
        role text NOT NULL,
        password_hash text NOT NULL,
        created_at bigint NOT NULL
      )
    `).then(() => undefined);
  }

  return ensureSchemaPromise;
};

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(
    password,
    salt,
    PASSWORD_ITERATIONS,
    PASSWORD_KEYLEN,
    PASSWORD_DIGEST,
  ).toString("hex");

  return `pbkdf2$${PASSWORD_ITERATIONS}$${salt}$${derivedKey}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [scheme, iterationsRaw, salt, expectedHex] = storedHash.split("$");
  if (scheme !== "pbkdf2" || !iterationsRaw || !salt || !expectedHex) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = crypto.pbkdf2Sync(password, salt, iterations, expected.length, PASSWORD_DIGEST);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

export const createAppIdentity = async (params: {
  userId: string;
  role: IdentityRole;
  password: string;
}) => {
  await ensureAuthSchema();
  const passwordHash = hashPassword(params.password);

  await db.insert(app_identities).values({
    user_id: params.userId,
    role: params.role,
    password_hash: passwordHash,
    created_at: Date.now(),
  });
};

export const removeAppIdentity = async (userId: string) => {
  await ensureAuthSchema();
  await db.delete(app_identities).where(eq(app_identities.user_id, userId));
};

export const verifyAppIdentity = async (params: {
  userId: string;
  role: IdentityRole;
  password: string;
}) => {
  await ensureAuthSchema();
  const rows = await db
    .select()
    .from(app_identities)
    .where(eq(app_identities.user_id, params.userId))
    .limit(1);

  const record = rows[0];
  if (!record || record.role !== params.role) {
    return null;
  }

  if (!verifyPassword(params.password, record.password_hash)) {
    return null;
  }

  return record;
};

export const listAppIdentitiesByRoles = async (roles: IdentityRole[]) => {
  await ensureAuthSchema();
  return db
    .select({
      userId: app_identities.user_id,
      role: app_identities.role,
    })
    .from(app_identities)
    .where(inArray(app_identities.role, roles))
    .orderBy(app_identities.user_id);
};
