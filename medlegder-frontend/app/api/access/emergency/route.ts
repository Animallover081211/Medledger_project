import {NextRequest, NextResponse} from "next/server";
import {emergencyAccess} from "../../../../lib/server/services/consent_service";
import {requireIdentity} from "../../_utils";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const identity = requireIdentity(request);
  if (identity instanceof NextResponse) return identity;
  if (identity.role !== "doctor") {
    return NextResponse.json({error: "only doctors can request emergency access"}, {status: 403});
  }

  const body = (await request.json()) as {patientId: string; reason: string};
  const allowed = await emergencyAccess(body.patientId, identity.userId, body.reason);
  return NextResponse.json({allowed});
};
