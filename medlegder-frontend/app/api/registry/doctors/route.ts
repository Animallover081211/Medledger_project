import { NextRequest, NextResponse } from "next/server";
import { getDoctor } from "../../../../lib/server/services/identity_service";
import { listAppIdentitiesByRoles } from "../../../../lib/server/services/app_auth_service";
import { requireIdentity } from "../../_utils";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  try {
    const rows = await listAppIdentitiesByRoles(["doctor", "hospital"]);
    const doctors = await Promise.all(
      rows.map(async ({ userId, role }) => {
        try {
          const doctor = await getDoctor(userId);
          return {
            id: userId,
            role,
            name: doctor.name,
            specialty: doctor.specialty,
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({ doctors: doctors.filter(Boolean) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get doctors";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
