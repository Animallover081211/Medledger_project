import { NextRequest, NextResponse } from "next/server";
import { getDoctorRequests } from "../../../../lib/server/services/access_request_service";
import { getPatient } from "../../../../lib/server/services/identity_service";
import { requireIdentity } from "../../_utils";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
    const identity = await requireIdentity(request);
    if (identity instanceof NextResponse) return identity;

    if (identity.role !== "doctor") {
        return NextResponse.json({ error: "only doctors can view their patients" }, { status: 403 });
    }

    try {
        const requests = await getDoctorRequests(identity.userId);
        // Filter for accepted ones and get unique patient IDs
        const acceptedPatients = Array.from(new Set(
            requests
                .filter(r => r.status === "accepted")
                .map(r => r.patient_id)
        ));

        const patients = await Promise.all(
          acceptedPatients.map(async (patientId) => {
            try {
              const patient = await getPatient(patientId);
              return { id: patientId, name: patient.name };
            } catch {
              return { id: patientId, name: patientId };
            }
          }),
        );

        return NextResponse.json({ patients });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get patients";
        return NextResponse.json({ error: message }, { status: 500 });
    }
};
