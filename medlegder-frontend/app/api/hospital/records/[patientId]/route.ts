import { NextRequest, NextResponse } from "next/server";
import { listMedicalRecords } from "../../../../../lib/server/services/records_service";
import { requireIdentity } from "../../../_utils";

export const runtime = "nodejs";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) => {
  const { patientId } = await params;
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role !== "hospital") {
    return NextResponse.json({ error: "hospital staff only" }, { status: 403 });
  }

  try {
    const result = await listMedicalRecords(patientId, identity.userId, true);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
