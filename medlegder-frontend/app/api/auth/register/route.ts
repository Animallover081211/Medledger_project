import {NextRequest, NextResponse} from "next/server";
import {registerDoctor, registerPatient} from "../../../../lib/server/services/identity_service";
import {createAppIdentity, removeAppIdentity} from "../../../../lib/server/services/app_auth_service";
import {signJwt} from "../../../../lib/server/utils/jwt";
import {generateIdentityId, type IdentityRole} from "../../../../lib/shared/identity_id";

type Role = IdentityRole;

const isDuplicateIdentityError = (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code?: unknown }).code) : "";
  return code === "23505" || message.includes("already exists") || message.includes("duplicate key");
};

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const body = (await request.json()) as {
    role: Role;
    name: string;
    specialty?: string;
    password?: string;
  };

  if (!body.role || !body.name || !body.password) {
    return NextResponse.json({error: "role, name, and password are required"}, {status: 400});
  }

  const validRoles: Role[] = ["patient", "doctor", "hospital", "pharmacy", "regulator"];
  if (!validRoles.includes(body.role)) {
    return NextResponse.json({error: "invalid role"}, {status: 400});
  }

  try {
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const userId = generateIdentityId(body.role);
      try {
        await createAppIdentity({
          userId,
          role: body.role,
          password: body.password,
        });

        if (body.role === "patient") {
          await registerPatient(userId, body.name);
        } else if (body.role === "doctor" || body.role === "hospital") {
          await registerDoctor(userId, body.name, body.specialty ?? "");
        } else {
          // Pharmacy and Regulator - store in local identity (not on blockchain for MVP)
          // This is a placeholder until chaincode is extended for these roles
        }
        const token = await signJwt({userId, role: body.role});
        return NextResponse.json({
          token,
          user: {
            id: userId,
            role: body.role,
          },
        });
      } catch (err) {
        try {
          await removeAppIdentity(userId);
        } catch {
          // ignore rollback errors
        }

        if (!isDuplicateIdentityError(err) || attempt === maxAttempts - 1) {
          throw err;
        }
      }
    }
  } catch (err) {
    if (isDuplicateIdentityError(err)) {
      return NextResponse.json(
        {error: `${body.role} ID already exists. Please use a different ID.`},
        {status: 409}
      );
    }
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({error: message}, {status: 500});
  }
};
