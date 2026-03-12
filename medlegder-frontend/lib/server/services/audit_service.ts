import {createLedgerRepository} from "../repositories/ledger_repository";

export const getAuditLog = async (patientId: string) => {
  const repo = createLedgerRepository();
  try {
    const result = await repo.evaluate("GetAuditLog", [patientId]);
    const text = Buffer.from(result).toString();
    return JSON.parse(text);
  } finally {
    repo.close();
  }
};
