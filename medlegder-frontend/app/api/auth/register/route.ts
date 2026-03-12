import {NextRequest, NextResponse} from "next/server";
import {registerDoctor, registerPatient} from "../../../../lib/server/services/identity_service";
import {requireIdentity} from "../../_utils";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const identity = requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const body = (await request.json()) as {
    role: "patient" | "doctor";
    name: string;
    specialty?: string;
  };

  try {
    if (body.role === "patient") {
      await registerPatient(identity.userId, body.name);
      return NextResponse.json({status: "registered", role: "patient", id: identity.userId});
    }

    await registerDoctor(identity.userId, body.name, body.specialty ?? "");
    return NextResponse.json({status: "registered", role: "doctor", id: identity.userId});
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage.includes("already exists")) {
      return NextResponse.json(
        {error: `${body.role === "patient" ? "Patient" : "Doctor"} ID already exists. Please use a different ID.`},
        {status: 409}
      );
    }
    throw err;
  }
};
