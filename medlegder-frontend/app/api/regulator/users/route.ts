import { NextRequest, NextResponse } from "next/server";
import { getDoctor, getPatient } from "../../../../lib/server/services/identity_service";
import { listAppIdentitiesByRoles } from "../../../../lib/server/services/app_auth_service";
import { requireIdentity } from "../../_utils";

type UserRole = "patient" | "doctor" | "hospital" | "pharmacy" | "regulator";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role !== "regulator") {
    return NextResponse.json({ error: "only regulators can view all users" }, { status: 403 });
  }

  try {
    const rows = await listAppIdentitiesByRoles(["patient", "doctor", "hospital", "pharmacy", "regulator"]);
    const users = await Promise.all(
      rows.map(async ({ userId, role }) => {
        try {
          if (role === "patient") {
            const patient = await getPatient(userId);
            return { id: userId, role, name: patient.name };
          }
          if (role === "doctor" || role === "hospital") {
            const doctor = await getDoctor(userId);
            return { id: userId, role, name: doctor.name };
          }
          return { id: userId, role: role as UserRole, name: role.charAt(0).toUpperCase() + role.slice(1) };
        } catch {
          return { id: userId, role: role as UserRole, name: "Unavailable" };
        }
      }),
    );

    return NextResponse.json({
      users: users.sort((a, b) => a.role.localeCompare(b.role) || a.id.localeCompare(b.id)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
