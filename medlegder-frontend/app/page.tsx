"use client";

import Link from "next/link";
import {Shell} from "./components/layout/shell";
import {Navbar} from "./components/layout/navbar";
import {Button} from "./components/ui/button";
import {Card} from "./components/ui/card";

const features = [
  {
    title: "On-chain consent",
    description:
      "Patient consent and audit trails live on Hyperledger Fabric for tamper-evidence and shared trust.",
  },
  {
    title: "Off-chain records",
    description:
      "Clinical records are stored in Turso for speed, while access is strictly gated by chaincode.",
  },
  {
    title: "Role-aware access",
    description:
      "Doctors and patients get tailored flows with identity-based authentication.",
  },
];

export default function Home() {
  return (
    <Shell>
      <Navbar />
      <main className="mt-16 grid gap-12">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/50">MedLedger</p>
            <h1 className="text-4xl font-semibold leading-tight text-black sm:text-5xl">
              Consent-first medical data sharing for modern care networks.
            </h1>
            <p className="max-w-xl text-base leading-7 text-black/70">
              A secure healthcare platform where patients control access to their medical records
              using blockchain-based consent management.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button variant="primary">Get Started</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary">Login</Button>
              </Link>
              <Link href="/patient">
                <Button variant="secondary">Patient Portal</Button>
              </Link>
              <Link href="/doctor">
                <Button variant="secondary">Doctor Portal</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-black/10 bg-white/70 p-6 backdrop-blur">
            <div className="grid gap-4">
              <div className="rounded-2xl bg-black p-5 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Hyperledger Fabric</p>
                <p className="mt-3 text-lg font-semibold">Consent ledger verified.</p>
                <p className="mt-2 text-sm text-white/70">
                  Every decision is endorsed by both orgs and recorded for audit.
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">Turso</p>
                <p className="mt-3 text-lg font-semibold text-black">Records stay fast.</p>
                <p className="mt-2 text-sm text-black/60">
                  Storage optimized for speed without compromising consent rules.
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">ID-based Auth</p>
                <p className="mt-3 text-lg font-semibold text-black">Simple & secure.</p>
                <p className="mt-2 text-sm text-black/60">
                  No passwords. Just your identity controls access.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} title={feature.title}>
              <p className="text-sm text-black/70">{feature.description}</p>
            </Card>
          ))}
        </section>
      </main>
    </Shell>
  );
}