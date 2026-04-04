import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "__session";

export interface SessionPayload {
  sub: string;
  username: string;
  photoURL: string | null;
  type: "human";
  memberships: Record<string, { id: string; role: "admin" | "member" }>;
}

function getSecret(): Uint8Array {
  const hex = process.env.SESSION_SECRET;
  if (!hex) throw new Error("SESSION_SECRET env var is required");
  return new Uint8Array(Buffer.from(hex, "hex"));
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
