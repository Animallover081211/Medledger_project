import {db} from "../repositories/db";
import {access_requests} from "../repositories/schema";
import {eq, desc} from "drizzle-orm";

export type AccessRequest = {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: string;
  created_at: number;
};

export const createAccessRequest = async (patientId: string, doctorId: string): Promise<string> => {
  const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(access_requests).values({
    id,
    patient_id: patientId,
    doctor_id: doctorId,
    status: "pending",
    created_at: Date.now(),
  });
  return id;
};

export const getPendingRequestsForPatient = async (patientId: string): Promise<AccessRequest[]> => {
  const result = await db
    .select()
    .from(access_requests)
    .where(eq(access_requests.patient_id, patientId))
    .orderBy(desc(access_requests.created_at));
  return result as AccessRequest[];
};

export const getDoctorRequests = async (doctorId: string): Promise<AccessRequest[]> => {
  const result = await db
    .select()
    .from(access_requests)
    .where(eq(access_requests.doctor_id, doctorId))
    .orderBy(desc(access_requests.created_at));
  return result as AccessRequest[];
};

export const getRequestById = async (requestId: string): Promise<AccessRequest | null> => {
  const result = await db
    .select()
    .from(access_requests)
    .where(eq(access_requests.id, requestId))
    .limit(1);
  return (result[0] as AccessRequest) || null;
};

export const updateRequestStatus = async (requestId: string, status: string): Promise<void> => {
  await db
    .update(access_requests)
    .set({status})
    .where(eq(access_requests.id, requestId));
};
