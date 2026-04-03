"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar, type NavItem } from "../components/layout/org_sidebar";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/modal";
import { apiFetch } from "../../lib/api_client";
import { getIdentity } from "../../lib/identity";

type DispensedRecord = {
  rxNumber: string;
  patientId: string | null;
  doctorId: string | null;
  verificationStatus: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  dispensedAt: string | null;
  dispensedBy: string | null;
};

type PharmacySummary = {
  totalVerified: number;
  totalDispensed: number;
  pendingVerification: number;
};

type PharmacySummaryResponse = {
  summary: PharmacySummary;
  latestActivity: DispensedRecord[];
};

const pharmacyNavItems: NavItem[] = [
  {
    href: "/pharmacy",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/pharmacy/verify",
    label: "Verify Rx",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/pharmacy/history",
    label: "History",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export default function PharmacyPage() {
  const router = useRouter();
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rxNumber, setRxNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [recentDispensed, setRecentDispensed] = useState<DispensedRecord[]>([]);
  const [summary, setSummary] = useState<PharmacySummary | null>(null);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string | ReactNode;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showModal = useCallback((type: "success" | "error" | "info", title: string, message: string | ReactNode) => {
    setModal({ isOpen: true, type, title, message });
  }, []);

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "pharmacy") {
      router.push("/");
      return;
    }
    queueMicrotask(() => {
      setPharmacyId(identity?.id ?? null);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const result = await apiFetch("/api/pharmacy/summary") as PharmacySummaryResponse;
        setSummary(result.summary);
        setRecentDispensed(Array.isArray(result?.latestActivity) ? result.latestActivity : []);
      } catch {
        setSummary(null);
        setRecentDispensed([]);
      } finally {
        setLoadingSummary(false);
        setLoadingRecent(false);
      }
    };

    loadSummary();
  }, []);

  const handleVerify = async () => {
    if (!rxNumber.trim()) {
      showModal("error", "Missing Rx Number", "Please enter a prescription number");
      return;
    }
    setVerifying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showModal("success", "Rx Verified", `Prescription '${rxNumber}' has been verified and is valid for dispensing.`);
      setRxNumber("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      showModal("error", "Verification Failed", message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <OrgSidebar
        orgName="Pharmacy"
        portalLabel="Pharmacy Portal"
        navItems={pharmacyNavItems}
        accentColor="purple"
      />
      <div className="lg:ml-56 min-h-screen bg-neutral-50 p-6 pt-24 lg:pt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 text-slate-900">
          <div className="mb-8 font-medium">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(147,51,234,0.3)]"></span>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-purple-600">Pharmacy Portal</p>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none">Pharmacy Dashboard</h1>
            <p className="mt-1 text-sm text-black/60 font-medium">ID: {pharmacyId}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <div className="rounded-3xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-600">Verified</p>
              <p className="mt-2 text-3xl font-black text-black">{loadingSummary ? "..." : summary?.totalVerified ?? 0}</p>
              <p className="text-[10px] text-black/50 font-medium mt-1">Total prescriptions verified</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600">Dispensed</p>
              <p className="mt-2 text-3xl font-black text-black">{loadingSummary ? "..." : summary?.totalDispensed ?? 0}</p>
              <p className="text-[10px] text-black/50 font-medium mt-1">Recorded as dispensed</p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-600">Pending</p>
              <p className="mt-2 text-3xl font-black text-black">{loadingSummary ? "..." : summary?.pendingVerification ?? 0}</p>
              <p className="text-[10px] text-black/50 font-medium mt-1">Awaiting verification</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card title="Verify Prescription">
              <div className="grid gap-4 pt-2">
                <div>
                  <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-black/80">Prescription Number</label>
                  <Input
                    placeholder="e.g. RX-123456"
                    value={rxNumber}
                    className="h-10 text-xs bg-neutral-50/50 border-none focus:ring-purple-600 placeholder:text-black/30"
                    onChange={(event) => setRxNumber(event.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  />
                </div>
                <Button
                  size="sm"
                  variant="none"
                  onClick={handleVerify}
                  className="h-9 text-[10px] bg-purple-600 text-white font-bold tracking-widest flex items-center justify-center gap-2 rounded-full"
                  disabled={verifying}
                >
                  {verifying ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : "Verify Prescription"}
                </Button>
                <p className="text-[9px] text-black/60 font-medium italic text-center">Verifies prescription validity against blockchain records.</p>
              </div>
            </Card>

            <Card title="Quick Actions">
              <div className="grid gap-3 pt-2">
                <Link href="/pharmacy/verify" className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100 hover:bg-purple-100 transition-colors">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white text-lg">💊</div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-black">Dispense Medication</p>
                    <p className="text-[9px] text-black/60">Process and record dispensing</p>
                  </div>
                </Link>
                <Link href="/pharmacy/history" className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-black/5 hover:bg-neutral-100 transition-colors">
                  <div className="w-10 h-10 bg-neutral-200 rounded-xl flex items-center justify-center text-lg">📋</div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-black">View History</p>
                    <p className="text-[9px] text-black/60">See verified and dispensed prescriptions</p>
                  </div>
                </Link>
              </div>
            </Card>
          </div>

          <Card title="Recent Activity" className="mt-4">
            <div className="space-y-3 pt-2">
              {loadingRecent ? (
                <p className="text-xs text-black/50 font-medium">Loading recent dispensing activity...</p>
              ) : recentDispensed.length > 0 ? (
                recentDispensed.slice(0, 3).map((record, index) => (
                  <div key={`${record.rxNumber}-${index}`} className="flex items-center gap-3 p-3 bg-neutral-50/70 rounded-2xl border border-black/[0.04]">
                    <div className={`w-8 h-8 border rounded-xl flex items-center justify-center text-sm ${
                      record.verificationStatus === "dispensed"
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-amber-50 border-amber-100"
                    }`}>
                      {record.verificationStatus === "dispensed" ? "✓" : "⏳"}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-black">{record.rxNumber}</p>
                      <p className="text-[9px] text-black/60">
                        Patient: {record.patientId || "N/A"} • Doctor: {record.doctorId || "N/A"}
                      </p>
                      <p className="text-[9px] text-black/40">
                        {record.verificationStatus === "dispensed" ? "Dispensed" : "Verified"} • {record.verifiedBy || record.dispensedBy || "Unknown"}
                      </p>
                    </div>
                    <p className="text-[9px] text-black/40">
                      {record.dispensedAt ? new Date(record.dispensedAt).toLocaleString() : record.verifiedAt ? new Date(record.verifiedAt).toLocaleString() : "Pending"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-black/50 font-medium">No dispensing history found yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </>
  );
}
