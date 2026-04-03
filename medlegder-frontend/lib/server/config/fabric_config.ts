import fs from "node:fs";
import path from "node:path";

export type FabricEnv = {
  mspId: string;
  peerEndpoint: string;
  tlsCertPath: string;
  certPath: string;
  keyPath: string;
  channelName: string;
  chaincodeName: string;
};

export const loadFabricEnv = (): FabricEnv => {
  const env = process.env;
  const mspId = env.FABRIC_MSP_ID ?? "HospitalMSP";
  const peerEndpoint = env.FABRIC_PEER_ENDPOINT ?? "localhost:7051";
  const tlsCertPath = required(env.FABRIC_TLS_CERT_PATH, "FABRIC_TLS_CERT_PATH");
  const certPath = required(env.FABRIC_USER_CERT_PATH, "FABRIC_USER_CERT_PATH");
  const keyPath = resolveKeyPath(required(env.FABRIC_USER_KEY_PATH, "FABRIC_USER_KEY_PATH"));
  const channelName = env.FABRIC_CHANNEL ?? "medledger";
  const chaincodeName = env.FABRIC_CHAINCODE ?? "medledger";

  return {
    mspId,
    peerEndpoint,
    tlsCertPath,
    certPath,
    keyPath,
    channelName,
    chaincodeName,
  };
};

export const readPem = (filePath: string): Buffer => {
  return fs.readFileSync(path.resolve(filePath));
};

const resolveKeyPath = (value: string): string => {
  const resolved = path.resolve(value);
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) return resolved;
  const entries = fs.readdirSync(resolved).filter((name) => !name.startsWith("."));
  if (!entries.length) {
    throw new Error(`FABRIC_USER_KEY_PATH directory is empty: ${resolved}`);
  }
  return path.join(resolved, entries[0]);
};

const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};
