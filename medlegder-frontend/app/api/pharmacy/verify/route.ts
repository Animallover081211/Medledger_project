import {NextRequest, NextResponse} from "next/server";
import {requireIdentity} from "../../_utils";
import {verifyPrescription} from "../../../../lib/server/services/pharmacy_service";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role !== "pharmacy") {
    return NextResponse.json({error: "only pharmacy can verify prescriptions"}, {status: 403});
  }

  try {
    const body = (await request.json()) as {rxNumber: string};
    if (!body.rxNumber?.trim()) {
      return NextResponse.json({error: "rxNumber is required"}, {status: 400});
    }

    const record = await verifyPrescription(body.rxNumber.trim(), identity.userId);
    return NextResponse.json({
      valid: true,
      rxNumber: record.rx_number,
      status: "verified",
      verifiedAt: new Date(record.verified_at ?? Date.now()).toISOString(),
      verifiedBy: record.verified_by ?? identity.userId,
      record,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    const status = message.toLowerCase().includes("already been dispensed") ? 409 : 500;
    return NextResponse.json({error: message}, {status});
  }
};
