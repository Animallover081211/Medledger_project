import {NextRequest, NextResponse} from "next/server";
import {verifyJwt} from "../../lib/server/utils/jwt";

type Role = "patient" | "doctor" | "hospital" | "pharmacy" | "regulator";

type Identity = {
  userId: string;
  role: Role;
};

export const getIdentity = async (request: NextRequest): Promise<Identity | null> => {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyJwt(token);
    if (payload) {
      return {userId: payload.userId, role: payload.role};
    }
  }

  const userId = request.headers.get("x-user-id");
  const role = request.headers.get("x-user-role") as Role | null;
  if (!userId || !role) {
    return null;
  }
  return {userId, role};
};

export const requireIdentity = async (request: NextRequest): Promise<Identity | NextResponse> => {
  const identity = await getIdentity(request);
  if (!identity) {
    return NextResponse.json({error: "Authentication required"}, {status: 401});
  }
  return identity;
};
