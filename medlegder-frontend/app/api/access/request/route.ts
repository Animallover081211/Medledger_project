import {NextRequest, NextResponse} from "next/server";
import {createAccessRequest, getPendingRequestsForPatient} from "../../../../lib/server/services/access_request_service";
import {requireIdentity} from "../../_utils";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;
  
  if (identity.role !== "doctor" && identity.role !== "hospital") {
    return NextResponse.json({error: "only doctors or hospital staff can request access"}, {status: 403});
  }

  try {
    const body = (await request.json()) as {patientId: string};
    const id = await createAccessRequest(body.patientId, identity.userId);
    return NextResponse.json({status: "pending", id});
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create request";
    return NextResponse.json({error: message}, {status: 500});
  }
};

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;
  
  if (identity.role !== "patient") {
    return NextResponse.json({error: "only patients can view requests"}, {status: 403});
  }

  try {
    const requests = await getPendingRequestsForPatient(identity.userId);
    return NextResponse.json({requests});
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get requests";
    return NextResponse.json({error: message}, {status: 500});
  }
};
