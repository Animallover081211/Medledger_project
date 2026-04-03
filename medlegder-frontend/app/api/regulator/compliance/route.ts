import {NextRequest, NextResponse} from "next/server";
import {getGrantedConsents} from "../../../../lib/server/services/consent_service";
import {getAuditLog} from "../../../../lib/server/services/audit_service";
import {db} from "../../../../lib/server/repositories/db";
import {access_requests, medical_records, pharmacy_prescriptions} from "../../../../lib/server/repositories/schema";
import {listDispensedPrescriptions} from "../../../../lib/server/services/pharmacy_service";
import {requireIdentity} from "../../_utils";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const identity = await requireIdentity(request);
  if (identity instanceof NextResponse) return identity;

  if (identity.role !== "regulator") {
    return NextResponse.json({error: "only regulators can view compliance reports"}, {status: 403});
  }

  try {
    const patientIds = new Set<string>();

    const [accessRows, recordRows, pharmacyRows, dispensedRows] = await Promise.all([
      db.select({ patientId: access_requests.patient_id, status: access_requests.status }).from(access_requests),
      db.select({ patientId: medical_records.patient_id }).from(medical_records),
      db.select({
        rxNumber: pharmacy_prescriptions.rx_number,
        patientId: pharmacy_prescriptions.patient_id,
        verificationStatus: pharmacy_prescriptions.verification_status,
      }).from(pharmacy_prescriptions),
      listDispensedPrescriptions(),
    ]);

    for (const row of accessRows) {
      if (row.patientId) patientIds.add(row.patientId);
    }
    for (const row of recordRows) {
      if (row.patientId) patientIds.add(row.patientId);
    }
    for (const row of pharmacyRows) {
      if (row.patientId) patientIds.add(row.patientId);
    }

    const auditByPatient = await Promise.all(
      Array.from(patientIds).map(async (patientId) => {
        try {
          return await getAuditLog(patientId);
        } catch {
          return [];
        }
      }),
    );

    const audit = auditByPatient.flat();
    const grantedConsents = patientIds.size > 0
      ? (await Promise.all(Array.from(patientIds).map((patientId) => getGrantedConsents(patientId)))).flat()
      : [];

    const totalActions = audit.length + accessRows.length + recordRows.length + pharmacyRows.length + dispensedRows.length;
    const granted = grantedConsents.length;
    const revoked = audit.filter((entry) => entry.action === "REVOKE").length;
    const emergencyAccess = audit.filter((entry) => entry.action === "EMERGENCY_ACCESS").length;
    const pendingRequests = accessRows.filter((row) => row.status === "pending").length
      + pharmacyRows.filter((row) => row.verificationStatus === "pending").length;

    const issuesFound = revoked + emergencyAccess;
    const alerts = [];
    if (emergencyAccess > 0) {
      alerts.push({
        severity: "Review",
        message: `${emergencyAccess} emergency access event(s) were recorded and should be reviewed.`,
      });
    }
    if (pendingRequests > 0) {
      alerts.push({
        severity: "Pending",
        message: `${pendingRequests} request or prescription record(s) still require follow-up.`,
      });
    }

    return NextResponse.json({
      summary: {
        totalActions,
        granted,
        revoked,
        emergencyAccess,
        pendingRequests,
      },
      compliance: {
        hipaaCompliant: issuesFound === 0,
        lastAudit: new Date().toISOString(),
        issuesFound,
      },
      alerts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get compliance report";
    return NextResponse.json({error: message}, {status: 500});
  }
};
