import { NextRequest, NextResponse } from "next/server";
import { getDoctorRequests } from "../../../../lib/server/services/access_request_service";
import { requireIdentity } from "../../_utils";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
    const identity = await requireIdentity(request);
    if (identity instanceof NextResponse) return identity;

    if (identity.role !== "hospital") {
        return NextResponse.json({ error: "only hospital staff can view their patients" }, { status: 403 });
    }

    try {
        const requests = await getDoctorRequests(identity.userId);
        const acceptedPatients = Array.from(new Set(
            requests
                .filter(r => r.status === "accepted")
                .map(r => r.patient_id)
        ));

        return NextResponse.json({ patients: acceptedPatients });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get patients";
        return NextResponse.json({ error: message }, { status: 500 });
    }
};
