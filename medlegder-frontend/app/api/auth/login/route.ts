import {NextRequest, NextResponse} from "next/server";
import {getPatient, getDoctor} from "../../../../lib/server/services/identity_service";
import {verifyAppIdentity} from "../../../../lib/server/services/app_auth_service";
import {signJwt} from "../../../../lib/server/utils/jwt";

type Role = "patient" | "doctor" | "hospital" | "pharmacy" | "regulator";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const body = (await request.json()) as {
    userId: string;
    role: Role;
    password: string;
  };

  if (!body.userId || !body.role || !body.password) {
    return NextResponse.json({error: "userId, role, and password are required"}, {status: 400});
  }

  try {
    const appIdentity = await verifyAppIdentity({
      userId: body.userId,
      role: body.role,
      password: body.password,
    });

    if (!appIdentity) {
      return NextResponse.json({error: "Invalid ID, role, or password"}, {status: 401});
    }

    if (body.role === "patient") {
      await getPatient(body.userId);
    } else if (body.role === "doctor" || body.role === "hospital") {
      await getDoctor(body.userId);
    } else {
      // Pharmacy and Regulator - no blockchain lookup needed for MVP
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not found")) {
      return NextResponse.json({error: "Not registered on-chain yet"}, {status: 404});
    }
    throw err;
  }

  const token = await signJwt({userId: body.userId, role: body.role});

  return NextResponse.json({
    token,
    user: {
      id: body.userId,
      role: body.role,
    },
  });
};
