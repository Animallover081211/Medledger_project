import {NextRequest, NextResponse} from "next/server";
import {registerDoctor, registerPatient} from "../../../../lib/server/services/identity_service";
import {signJwt} from "../../../../lib/server/utils/jwt";

type Role = "patient" | "doctor" | "hospital" | "pharmacy" | "regulator";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const body = (await request.json()) as {
    userId: string;
    role: Role;
    name: string;
    specialty?: string;
  };

  if (!body.userId || !body.role || !body.name) {
    return NextResponse.json({error: "userId, role, and name are required"}, {status: 400});
  }

  const validRoles: Role[] = ["patient", "doctor", "hospital", "pharmacy", "regulator"];
  if (!validRoles.includes(body.role)) {
    return NextResponse.json({error: "invalid role"}, {status: 400});
  }

  try {
    if (body.role === "patient") {
      await registerPatient(body.userId, body.name);
    } else if (body.role === "doctor" || body.role === "hospital") {
      await registerDoctor(body.userId, body.name, body.specialty ?? "");
    } else {
      // Pharmacy and Regulator - store in local identity (not on blockchain for MVP)
      // This is a placeholder until chaincode is extended for these roles
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage.includes("already exists")) {
      return NextResponse.json(
        {error: `${body.role} ID already exists. Please use a different ID.`},
        {status: 409}
      );
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
