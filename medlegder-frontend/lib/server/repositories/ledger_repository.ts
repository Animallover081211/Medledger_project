import {connect, Contract, Gateway, Identity, Signer, signers} from "@hyperledger/fabric-gateway";
import grpc from "@grpc/grpc-js";
import crypto from "node:crypto";
import {loadFabricEnv, readPem} from "../config/fabric_config";

export type LedgerRepository = {
  evaluate: (fn: string, args: string[]) => Promise<Uint8Array>;
  submit: (fn: string, args: string[]) => Promise<Uint8Array>;
  close: () => void;
};

const getEndorsingOrgs = () => {
  const raw = process.env.FABRIC_ENDORSING_ORGS;
  if (!raw) return null;
  const list = raw.split(",").map((value) => value.trim()).filter(Boolean);
  return list.length ? list : null;
};

export const createLedgerRepository = (): LedgerRepository => {
  const env = loadFabricEnv();

  const tlsRootCert = readPem(env.tlsCertPath);
  const client = new grpc.Client(env.peerEndpoint, grpc.credentials.createSsl(tlsRootCert));

  const identity: Identity = {
    mspId: env.mspId,
    credentials: readPem(env.certPath),
  };

  const privateKeyPem = readPem(env.keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const signer: Signer = signers.newPrivateKeySigner(privateKey);

  const gateway: Gateway = connect({
    client,
    identity,
    signer,
  });

  const network = gateway.getNetwork(env.channelName);
  const contract: Contract = network.getContract(env.chaincodeName);

  return {
    evaluate: (fn, args) => contract.evaluateTransaction(fn, ...args),
    submit: async (fn, args) => {
      const endorsingOrganizations = getEndorsingOrgs();
      if (!endorsingOrganizations) {
        return contract.submitTransaction(fn, ...args);
      }

      const proposal = contract.newProposal(fn, {
        arguments: args,
        endorsingOrganizations,
      });
      const endorsed = await proposal.endorse();
      const submitted = await endorsed.submit();
      const result = await submitted.getResult();
      return result;
    },
    close: () => {
      gateway.close();
      client.close();
    },
  };
};
