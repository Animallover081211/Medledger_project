import {NextRequest, NextResponse} from "next/server";
import {getAuditLog} from "../../../../lib/server/services/audit_service";
import {requireIdentity} from "../../_utils";

export const runtime = "nodejs";

export const GET = async (
  request: NextRequest,
  {params}: {params: Promise<{patientId: string}>}
) => {
  const {patientId} = await params;
  const identity = requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role === "patient" && patientId !== identity.userId) {
    return NextResponse.json({error: "patients can only view their own audit"}, {status: 403});
  }

  const audit = await getAuditLog(patientId);
  return NextResponse.json({audit});
};
