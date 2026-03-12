import { eq } from "drizzle-orm";
import { db } from "./db";
import { medical_records } from "./schema";

export type MedicalRecord = {
  id: string;
  patient_id: string;
  record_type: string;
  payload: string;
  created_at: number;
};

export const insertMedicalRecord = async (record: MedicalRecord) => {
  await db.insert(medical_records).values(record);
};

export const listMedicalRecordsByPatient = async (patientId: string) => {
  return db.select().from(medical_records).where(eq(medical_records.patient_id, patientId));
};
