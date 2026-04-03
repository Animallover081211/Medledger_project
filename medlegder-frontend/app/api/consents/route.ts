import {NextRequest, NextResponse} from "next/server";
import {getGrantedConsents} from "../../../lib/server/services/consent_service";
import {requireIdentity} from "../_utils";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;
  if (identity.role !== "patient") {
    return NextResponse.json({error: "only patients can view their consents"}, {status: 403});
  }

  const consents = await getGrantedConsents(identity.userId);
  return NextResponse.json({consents});
};
