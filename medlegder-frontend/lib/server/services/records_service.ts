import { randomUUID } from "node:crypto";
import { insertMedicalRecord, listMedicalRecordsByPatient } from "../repositories/medical_record_repository";
import { requestAccess } from "./consent_service";

export const createMedicalRecord = async (
  patientId: string,
  doctorId: string,
  recordType: string,
  payload: string,
) => {
  const allowed = await requestAccess(patientId, doctorId);
  if (!allowed) {
    return { allowed: false };
  }

  await insertMedicalRecord({
    id: randomUUID(),
    patient_id: patientId,
    record_type: recordType,
    payload,
    created_at: Date.now(),
  });

  return { allowed: true };
};

export const listMedicalRecords = async (patientId: string, observerId: string, requiresConsent: boolean = true) => {
  if (requiresConsent) {
    const allowed = await requestAccess(patientId, observerId);
    if (!allowed) {
      return { allowed: false, records: [] as Array<unknown> };
    }
  }

  const records = await listMedicalRecordsByPatient(patientId);
  return { allowed: true, records };
};
