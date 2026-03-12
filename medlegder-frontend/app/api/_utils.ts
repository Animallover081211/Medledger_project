import {NextRequest, NextResponse} from "next/server";

type Role = "patient" | "doctor";

export const getIdentity = (request: NextRequest) => {
  const userId = request.headers.get("x-user-id");
  const role = request.headers.get("x-user-role") as Role | null;
  if (!userId || (role !== "patient" && role !== "doctor")) {
    return null;
  }
  return {userId, role};
};

export const requireIdentity = (request: NextRequest) => {
  const identity = getIdentity(request);
  if (!identity) {
    return NextResponse.json({error: "x-user-id and x-user-role required"}, {status: 400});
  }
  return identity;
};
