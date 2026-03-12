import {NextRequest, NextResponse} from "next/server";
import {createMedicalRecord} from "../../../lib/server/services/records_service";
import {requireIdentity} from "../_utils";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  const identity = requireIdentity(request);
  if (identity instanceof NextResponse) return identity;
  if (identity.role !== "doctor") {
    return NextResponse.json({error: "only doctors can create records"}, {status: 403});
  }

  const body = (await request.json()) as {
    patientId: string;
    recordType: string;
    payload: string;
  };

  const result = await createMedicalRecord(
    body.patientId,
    identity.userId,
    body.recordType,
    body.payload,
  );

  return NextResponse.json(result);
};
