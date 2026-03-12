import {NextRequest, NextResponse} from "next/server";
import {revokeConsent} from "../../../../lib/server/services/consent_service";
import {requireIdentity} from "../../_utils";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const identity = requireIdentity(request);
  if (identity instanceof NextResponse) return identity;
  if (identity.role !== "patient") {
    return NextResponse.json({error: "only patients can revoke consent"}, {status: 403});
  }

  try {
    const body = (await request.json()) as {doctorId: string};
    await revokeConsent(identity.userId, body.doctorId);
    return NextResponse.json({status: "revoked"});
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to revoke consent";
    return NextResponse.json({error: message}, {status: 400});
  }
};
