import { NextRequest, NextResponse } from "next/server";
import { listMedicalRecords } from "../../../../lib/server/services/records_service";
import { requireIdentity } from "../../_utils";

export const runtime = "nodejs";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) => {
  const { patientId } = await params;
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  // Doctors need consent, Patients can only see their OWN records
  if (identity.role === "patient" && identity.userId !== patientId) {
    return NextResponse.json({ error: "patients can only view their own records" }, { status: 403 });
  }

  if (identity.role !== "doctor" && identity.role !== "hospital" && identity.role !== "patient") {
    return NextResponse.json({ error: "unauthorized role" }, { status: 403 });
  }

  const isDoctor = identity.role === "doctor" || identity.role === "hospital";
  const result = await listMedicalRecords(patientId, identity.userId, isDoctor);
  return NextResponse.json(result);
};
