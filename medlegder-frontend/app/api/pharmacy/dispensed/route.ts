import {NextRequest, NextResponse} from "next/server";
import {requireIdentity} from "../../_utils";
import {listDispensedPrescriptions, markPrescriptionDispensed} from "../../../../lib/server/services/pharmacy_service";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role !== "pharmacy") {
    return NextResponse.json({error: "only pharmacy can view dispensed records"}, {status: 403});
  }

  try {
    const records = await listDispensedPrescriptions();
    return NextResponse.json({
      dispensed: records.map((record) => ({
        rxNumber: record.rx_number,
        patientId: record.patient_id,
        doctorId: record.doctor_id,
        dispensedAt: record.dispensed_at ? new Date(record.dispensed_at).toISOString() : null,
        dispensedBy: record.dispensed_by,
        verifiedAt: record.verified_at ? new Date(record.verified_at).toISOString() : null,
        verifiedBy: record.verified_by,
        status: record.verification_status,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get dispensed records";
    return NextResponse.json({error: message}, {status: 500});
  }
};

export const POST = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role !== "pharmacy") {
    return NextResponse.json({error: "only pharmacy can record dispensed prescriptions"}, {status: 403});
  }

  try {
    const body = (await request.json()) as {rxNumber: string};
    if (!body.rxNumber?.trim()) {
      return NextResponse.json({error: "rxNumber is required"}, {status: 400});
    }

    const record = await markPrescriptionDispensed(body.rxNumber.trim(), identity.userId);
    if (!record) {
      return NextResponse.json({error: "prescription not found, verify it first"}, {status: 404});
    }

    return NextResponse.json({
      status: "dispensed",
      rxNumber: record.rx_number,
      dispensedAt: record.dispensed_at ? new Date(record.dispensed_at).toISOString() : null,
      dispensedBy: record.dispensed_by,
      record,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record dispense";
    return NextResponse.json({error: message}, {status: 500});
  }
};
