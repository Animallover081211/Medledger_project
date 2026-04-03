import { NextRequest, NextResponse } from "next/server";
import { getAuditLog } from "../../../../../lib/server/services/audit_service";
import { requireIdentity } from "../../../_utils";

export const runtime = "nodejs";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) => {
  const { patientId } = await params;
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role !== "regulator") {
    return NextResponse.json({ error: "only regulators can view audit logs" }, { status: 403 });
  }

  try {
    const audit = await getAuditLog(patientId);
    return NextResponse.json({ audit });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
