import { NextRequest, NextResponse } from "next/server";
import { getPatient } from "../../../../lib/server/services/identity_service";
import { listAppIdentitiesByRoles } from "../../../../lib/server/services/app_auth_service";
import { requireIdentity } from "../../_utils";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  try {
    const rows = await listAppIdentitiesByRoles(["patient"]);
    const patients = await Promise.all(
      rows.map(async ({ userId }) => {
        try {
          const patient = await getPatient(userId);
          return {
            id: userId,
            name: patient.name,
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({ patients: patients.filter(Boolean) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get patients";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
