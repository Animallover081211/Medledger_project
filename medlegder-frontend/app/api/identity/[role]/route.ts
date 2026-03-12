import {NextRequest, NextResponse} from "next/server";
import {getPatient, getDoctor} from "../../../../lib/server/services/identity_service";
import {requireIdentity} from "../../_utils";

export const runtime = "nodejs";

export const GET = async (
  request: NextRequest,
  {params}: {params: Promise<{role: string}>}
) => {
  const {role} = await params;
  const identity = requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (role !== identity.role) {
    return NextResponse.json({error: "Role mismatch"}, {status: 403});
  }

  try {
    if (role === "patient") {
      const patient = await getPatient(identity.userId);
      return NextResponse.json({name: patient.name, id: patient.id});
    } else {
      const doctor = await getDoctor(identity.userId);
      return NextResponse.json({name: doctor.name, id: doctor.id, specialty: doctor.specialty});
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not found")) {
      return NextResponse.json({error: "Not registered on-chain yet"}, {status: 404});
    }
    throw err;
  }
};
