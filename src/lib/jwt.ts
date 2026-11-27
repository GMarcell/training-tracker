import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = { userId: string };

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  // HS256 needs at least 32 bytes of key material; 32 hex chars is the
  // minimum acceptable entropy for this purpose.
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters (use `openssl rand -hex 32`)",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string" || payload.userId.length === 0) {
      return null;
    }
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
