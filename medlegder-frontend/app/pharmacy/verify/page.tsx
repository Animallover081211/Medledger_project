"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar, type NavItem } from "../../components/layout/org_sidebar";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";

const pharmacyNavItems: NavItem[] = [
  { href: "/pharmacy", label: "Dashboard", icon: <span>▣</span> },
  { href: "/pharmacy/verify", label: "Verify Rx", icon: <span>✓</span> },
  { href: "/pharmacy/history", label: "History", icon: <span>📋</span> },
];

export default function PharmacyVerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rxNumber, setRxNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    rxNumber: string;
    status: string;
    verifiedAt: string;
    verifiedBy: string;
    dispensedAt?: string | null;
    dispensedBy?: string | null;
  } | null>(null);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string | ReactNode;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const showModal = useCallback((type: "success" | "error" | "info", title: string, message: string | ReactNode) => {
    setModal({ isOpen: true, type, title, message });
  }, []);

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "pharmacy") {
      router.push("/");
      return;
    }
    setLoading(false);
  }, [router]);

  const handleVerify = async () => {
    if (!rxNumber.trim()) {
      showModal("error", "Missing Rx Number", "Please enter a prescription number");
      return;
    }
    setVerifying(true);
    try {
      const response = await apiFetch("/api/pharmacy/verify", {
        method: "POST",
        body: JSON.stringify({ rxNumber: rxNumber.trim() }),
      });
      setResult(response);
      showModal("success", "Prescription Verified", `Prescription ${rxNumber.trim()} is valid for dispensing.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      showModal("error", "Verification Failed", message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDispense = async () => {
    const targetRx = result?.rxNumber || rxNumber.trim();
    if (!targetRx) {
      showModal("error", "Missing Rx Number", "Verify a prescription before dispensing it");
      return;
    }
    setDispensing(true);
    try {
      const response = await apiFetch("/api/pharmacy/dispensed", {
        method: "POST",
        body: JSON.stringify({ rxNumber: targetRx }),
      });
      setResult((prev) =>
        prev
          ? {
              ...prev,
              status: "dispensed",
              dispensedAt: response.dispensedAt,
              dispensedBy: response.dispensedBy,
            }
          : prev,
      );
      showModal("success", "Medication Dispensed", `Prescription ${targetRx} has been recorded as dispensed.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dispensing failed";
      showModal("error", "Dispense Failed", message);
    } finally {
      setDispensing(false);
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
      <OrgSidebar orgName="Pharmacy" portalLabel="Pharmacy Portal" navItems={pharmacyNavItems} accentColor="purple" />
      <div className="lg:ml-56 min-h-screen bg-neutral-50 p-6 pt-24 lg:pt-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 text-slate-900">
          <div className="mb-8">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-purple-600 mb-1">Pharmacy Portal</p>
            <h1 className="text-2xl font-black text-black tracking-tight leading-none">Verify Prescription</h1>
            <p className="mt-1 text-sm text-black/60 font-medium">Check whether a prescription is valid before dispensing.</p>
          </div>

          <Card title="Verification Form">
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
            </div>
          </Card>

          {result && (
            <Card title="Last Result" className="mt-6">
              <div className="grid gap-2 pt-2 text-sm">
                <p><span className="font-black">Rx:</span> {result.rxNumber}</p>
                <p><span className="font-black">Status:</span> {result.status}</p>
                <p><span className="font-black">Valid:</span> {result.valid ? "Yes" : "No"}</p>
                <p><span className="font-black">Verified At:</span> {new Date(result.verifiedAt).toLocaleString()}</p>
                <p><span className="font-black">Verified By:</span> {result.verifiedBy}</p>
                {result.dispensedAt && <p><span className="font-black">Dispensed At:</span> {new Date(result.dispensedAt).toLocaleString()}</p>}
                {result.dispensedBy && <p><span className="font-black">Dispensed By:</span> {result.dispensedBy}</p>}
              </div>
              <div className="pt-4">
                <Button
                  size="sm"
                  variant="none"
                  onClick={handleDispense}
                  className="h-9 text-[10px] bg-black text-white font-bold tracking-widest flex items-center justify-center gap-2 rounded-full"
                  disabled={dispensing}
                >
                  {dispensing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Recording...
                    </>
                  ) : "Mark as Dispensed"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={modal.isOpen} onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))} title={modal.title} message={modal.message} type={modal.type} />
    </>
  );
}
