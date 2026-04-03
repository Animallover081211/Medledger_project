import { NextRequest, NextResponse } from "next/server";
import { listVerifiedPrescriptions } from "../../../../lib/server/services/pharmacy_service";
import { requireIdentity } from "../../_utils";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role !== "doctor" && identity.role !== "hospital" && identity.role !== "pharmacy") {
    return NextResponse.json({ error: "only doctors, hospital staff, or pharmacy can view verified prescriptions" }, { status: 403 });
  }

  try {
    const records = await listVerifiedPrescriptions();
    return NextResponse.json({
      prescriptions: records.map((record) => ({
        rxNumber: record.rx_number,
        verifiedAt: record.verified_at ? new Date(record.verified_at).toISOString() : null,
        verifiedBy: record.verified_by,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load verified prescriptions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
