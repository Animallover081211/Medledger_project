import {createLedgerRepository} from "../repositories/ledger_repository";

export const registerPatient = async (patientId: string, name: string) => {
  const repo = createLedgerRepository();
  try {
    await repo.submit("RegisterPatient", [patientId, name]);
  } finally {
    repo.close();
  }
};

export const registerDoctor = async (doctorId: string, name: string, specialty: string) => {
  const repo = createLedgerRepository();
  try {
    await repo.submit("RegisterDoctor", [doctorId, name, specialty]);
  } finally {
    repo.close();
  }
};

export const getPatient = async (patientId: string) => {
  const repo = createLedgerRepository();
  try {
    const data = await repo.evaluate("GetPatient", [patientId]);
    return JSON.parse(new TextDecoder().decode(data));
  } finally {
    repo.close();
  }
};

export const getDoctor = async (doctorId: string) => {
  const repo = createLedgerRepository();
  try {
    const data = await repo.evaluate("GetDoctor", [doctorId]);
    return JSON.parse(new TextDecoder().decode(data));
  } finally {
    repo.close();
  }
};
