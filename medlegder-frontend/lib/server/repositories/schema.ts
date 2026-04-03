import { bigint, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

export const medical_records = pgTable("medical_records", {
  id: text("id").primaryKey(),
  patient_id: text("patient_id").notNull(),
  record_type: text("record_type").notNull(),
  payload: text("payload").notNull(),
  created_at: bigint("created_at", { mode: "number" }).notNull(),
});

export const access_requests = pgTable("access_requests", {
  id: text("id").primaryKey(),
  patient_id: text("patient_id").notNull(),
  doctor_id: text("doctor_id").notNull(),
  status: text("status").notNull().default("pending"),
  created_at: bigint("created_at", { mode: "number" }).notNull(),
});

export const pharmacy_prescriptions = pgTable("pharmacy_prescriptions", {
  id: text("id").primaryKey(),
  rx_number: text("rx_number").notNull(),
  patient_id: text("patient_id"),
  doctor_id: text("doctor_id"),
  verification_status: text("verification_status").notNull().default("pending"),
  verification_notes: text("verification_notes"),
  verified_at: bigint("verified_at", { mode: "number" }),
  verified_by: text("verified_by"),
  dispensed_at: bigint("dispensed_at", { mode: "number" }),
  dispensed_by: text("dispensed_by"),
  created_at: bigint("created_at", { mode: "number" }).notNull(),
}, (table) => ({
  rxNumberIdx: uniqueIndex("pharmacy_prescriptions_rx_number_idx").on(table.rx_number),
}));
