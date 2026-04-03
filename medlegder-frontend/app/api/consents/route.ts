import {NextRequest, NextResponse} from "next/server";
import {getGrantedConsents} from "../../../lib/server/services/consent_service";
import {getDoctor} from "../../../lib/server/services/identity_service";
import {requireIdentity} from "../_utils";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;
  if (identity.role !== "patient") {
    return NextResponse.json({error: "only patients can view their consents"}, {status: 403});
  }

  const consents = await getGrantedConsents(identity.userId);
  const detailedConsents = await Promise.all(
    consents.map(async (consent) => {
      try {
        const doctor = await getDoctor(consent.doctorId);
        return {
          ...consent,
          doctorName: doctor.name,
          specialty: doctor.specialty,
        };
      } catch {
        return {
          ...consent,
          doctorName: consent.doctorId,
          specialty: null,
        };
      }
    }),
  );

  return NextResponse.json({consents: detailedConsents});
};
