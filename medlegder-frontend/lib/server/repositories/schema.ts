import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const medical_records = sqliteTable("medical_records", {
  id: text("id").primaryKey(),
  patient_id: text("patient_id").notNull(),
  record_type: text("record_type").notNull(),
  payload: text("payload").notNull(),
  created_at: integer("created_at").notNull(),
});

export const access_requests = sqliteTable("access_requests", {
  id: text("id").primaryKey(),
  patient_id: text("patient_id").notNull(),
  doctor_id: text("doctor_id").notNull(),
  status: text("status").notNull().default("pending"),
  created_at: integer("created_at").notNull(),
});
