import {SignJWT, jwtVerify, type JWTPayload} from "jose";

type Role = "patient" | "doctor" | "hospital" | "pharmacy" | "regulator";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
};

export type JwtPayload = JWTPayload & {
  userId: string;
  role: Role;
};

export const signJwt = async (payload: {userId: string; role: Role}): Promise<string> => {
  const token = await new SignJWT(payload)
    .setProtectedHeader({alg: "HS256"})
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
  return token;
};

export const verifyJwt = async (token: string): Promise<JwtPayload | null> => {
  try {
    const {payload} = await jwtVerify(token, getSecret());
    return payload as JwtPayload;
  } catch {
    return null;
  }
};