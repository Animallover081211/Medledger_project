import { NextRequest, NextResponse } from "next/server";
import { requireIdentity } from "../../_utils";
import { listPharmacyHistory } from "../../../../lib/server/services/pharmacy_service";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role !== "pharmacy") {
    return NextResponse.json({ error: "only pharmacy can view prescription history" }, { status: 403 });
  }

  try {
    const records = await listPharmacyHistory();
    return NextResponse.json({
      history: records.map((record) => ({
        rxNumber: record.rx_number,
        patientId: record.patient_id,
        doctorId: record.doctor_id,
        verificationStatus: record.verification_status,
        verifiedAt: record.verified_at ? new Date(record.verified_at).toISOString() : null,
        verifiedBy: record.verified_by,
        dispensedAt: record.dispensed_at ? new Date(record.dispensed_at).toISOString() : null,
        dispensedBy: record.dispensed_by,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load prescription history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
