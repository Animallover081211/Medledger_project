import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pkcs11js",
    "@hyperledger/fabric-gateway",
    "@grpc/grpc-js",
  ],
};

export default nextConfig;
