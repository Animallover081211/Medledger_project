import {createLedgerRepository} from "../repositories/ledger_repository";

export type ConsentEntry = {
  doctorId: string;
  grantedAt: number;
  status: string;
};

export const grantConsent = async (patientId: string, doctorId: string) => {
  const repo = createLedgerRepository();
  try {
    await repo.submit("GrantConsent", [patientId, doctorId]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("aborted") || message.toLowerCase().includes("not found") || message.toLowerCase().includes("does not exist")) {
      throw new Error(`Doctor '${doctorId}' is not registered on the blockchain`);
    }
    throw new Error(message);
  } finally {
    repo.close();
  }
};

export const revokeConsent = async (patientId: string, doctorId: string) => {
  const repo = createLedgerRepository();
  try {
    await repo.submit("RevokeConsent", [patientId, doctorId]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("aborted") || message.toLowerCase().includes("not found") || message.toLowerCase().includes("does not exist")) {
      throw new Error(`Doctor '${doctorId}' is not registered on the blockchain`);
    }
    throw new Error(message);
  } finally {
    repo.close();
  }
};

export const requestAccess = async (patientId: string, doctorId: string) => {
  const repo = createLedgerRepository();
  try {
    const result = await repo.submit("RequestAccess", [patientId, doctorId]);
    return Buffer.from(result).toString() === "true";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("aborted") || message.toLowerCase().includes("not found") || message.toLowerCase().includes("does not exist")) {
      throw new Error(`Patient '${patientId}' is not registered on the blockchain`);
    }
    throw new Error(message);
  } finally {
    repo.close();
  }
};

export const emergencyAccess = async (patientId: string, doctorId: string, reason: string) => {
  const repo = createLedgerRepository();
  try {
    const result = await repo.submit("EmergencyAccess", [patientId, doctorId, reason]);
    return Buffer.from(result).toString() === "true";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("aborted") || message.toLowerCase().includes("not found") || message.toLowerCase().includes("does not exist")) {
      throw new Error(`Patient '${patientId}' is not registered on the blockchain`);
    }
    throw new Error(message);
  } finally {
    repo.close();
  }
};

export const getGrantedConsents = async (patientId: string): Promise<ConsentEntry[]> => {
  const repo = createLedgerRepository();
  try {
    const result = await repo.evaluate("GetAuditLog", [patientId]);
    const auditData = JSON.parse(new TextDecoder().decode(result));
    
    const grantedDoctors = new Map<string, ConsentEntry>();
    
    for (const entry of auditData) {
      if (entry.action === "GRANT") {
        grantedDoctors.set(entry.doctorId, {
          doctorId: entry.doctorId,
          grantedAt: entry.timestamp,
          status: "GRANTED",
        });
      } else if (entry.action === "REVOKE") {
        grantedDoctors.delete(entry.doctorId);
      }
    }
    
    return Array.from(grantedDoctors.values());
  } catch (err) {
    return [];
  } finally {
    repo.close();
  }
};
