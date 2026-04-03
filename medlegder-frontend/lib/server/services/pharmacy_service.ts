import { desc, eq, isNotNull } from "drizzle-orm";
import { db } from "../repositories/db";
import { pharmacy_prescriptions } from "../repositories/schema";

export type PharmacyPrescription = {
  id: string;
  rx_number: string;
  patient_id: string | null;
  doctor_id: string | null;
  verification_status: string;
  verification_notes: string | null;
  verified_at: number | null;
  verified_by: string | null;
  dispensed_at: number | null;
  dispensed_by: string | null;
  created_at: number;
};

export type PharmacySummary = {
  totalVerified: number;
  totalDispensed: number;
  pendingVerification: number;
  latestActivity: PharmacyPrescription[];
};

const buildId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const verifyPrescription = async (rxNumber: string, verifiedBy: string): Promise<PharmacyPrescription> => {
  const now = Date.now();
  const id = buildId("rx");

  const [record] = await db
    .insert(pharmacy_prescriptions)
    .values({
      id,
      rx_number: rxNumber,
      verification_status: "verified",
      verified_at: now,
      verified_by: verifiedBy,
      created_at: now,
    })
    .onConflictDoUpdate({
      target: pharmacy_prescriptions.rx_number,
      set: {
        verification_status: "verified",
        verified_at: now,
        verified_by: verifiedBy,
      },
    })
    .returning();

  return record as PharmacyPrescription;
};

export const markPrescriptionDispensed = async (
  rxNumber: string,
  dispensedBy: string,
): Promise<PharmacyPrescription | null> => {
  const now = Date.now();
  const [existing] = await db
    .select()
    .from(pharmacy_prescriptions)
    .where(eq(pharmacy_prescriptions.rx_number, rxNumber))
    .limit(1);

  if (!existing) {
    return null;
  }

  if (existing.verification_status !== "verified") {
    return null;
  }

  const [record] = await db
    .update(pharmacy_prescriptions)
    .set({
      verification_status: "dispensed",
      dispensed_at: now,
      dispensed_by: dispensedBy,
    })
    .where(eq(pharmacy_prescriptions.rx_number, rxNumber))
    .returning();

  return record as PharmacyPrescription;
};

export const listDispensedPrescriptions = async (): Promise<PharmacyPrescription[]> => {
  const result = await db
    .select()
    .from(pharmacy_prescriptions)
    .where(isNotNull(pharmacy_prescriptions.dispensed_at))
    .orderBy(desc(pharmacy_prescriptions.dispensed_at));
  return result as PharmacyPrescription[];
};

export const listVerifiedPrescriptions = async (): Promise<PharmacyPrescription[]> => {
  const result = await db
    .select()
    .from(pharmacy_prescriptions)
    .where(eq(pharmacy_prescriptions.verification_status, "verified"))
    .orderBy(desc(pharmacy_prescriptions.verified_at));
  return result as PharmacyPrescription[];
};

export const getPharmacySummary = async (): Promise<PharmacySummary> => {
  const allRows = await db.select().from(pharmacy_prescriptions).orderBy(desc(pharmacy_prescriptions.created_at));
  const totalVerified = allRows.filter((row) => row.verification_status === "verified" || row.verification_status === "dispensed").length;
  const totalDispensed = allRows.filter((row) => row.verification_status === "dispensed").length;
  const pendingVerification = allRows.filter((row) => row.verification_status === "pending").length;

  return {
    totalVerified,
    totalDispensed,
    pendingVerification,
    latestActivity: allRows.slice(0, 5) as PharmacyPrescription[],
  };
};
