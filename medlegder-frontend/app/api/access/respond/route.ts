import {NextRequest, NextResponse} from "next/server";
import {updateRequestStatus, getRequestById} from "../../../../lib/server/services/access_request_service";
import {requireIdentity} from "../../_utils";
import {grantConsent} from "../../../../lib/server/services/consent_service";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;
  
  if (identity.role !== "patient") {
    return NextResponse.json({error: "only patients can respond to requests"}, {status: 403});
  }

  try {
    const body = (await request.json()) as {requestId: string; action: "accept" | "reject"};
    const {requestId, action} = body;

    const accessRequest = await getRequestById(requestId);
    if (!accessRequest) {
      return NextResponse.json({error: "Request not found"}, {status: 404});
    }

    if (action === "accept") {
      await grantConsent(identity.userId, accessRequest.doctor_id);
    }

    await updateRequestStatus(requestId, action === "accept" ? "accepted" : "rejected");
    return NextResponse.json({status: action === "accept" ? "accepted" : "rejected"});
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to respond to request";
    return NextResponse.json({error: message}, {status: 500});
  }
};
