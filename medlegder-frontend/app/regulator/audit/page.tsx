"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar, type NavItem } from "../../components/layout/org_sidebar";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";

type AuditRecord = {
  id: string;
  patientId: string;
  doctorId: string;
  action: string;
  allowed: boolean;
  reason: string;
  timestamp: string;
  txId: string;
};

const regulatorNavItems: NavItem[] = [
  { href: "/regulator", label: "Dashboard", icon: <span>▣</span> },
  { href: "/regulator/audit", label: "Audit Logs", icon: <span>🧾</span> },
  { href: "/regulator/compliance", label: "Compliance", icon: <span>🛡</span> },
];

export default function RegulatorAuditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditData, setAuditData] = useState<AuditRecord[]>([]);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string | ReactNode;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "regulator") {
      router.push("/");
      return;
    }
    setLoading(false);
  }, [router]);

  const handleViewAudit = async () => {
    if (!patientId.trim()) {
      setModal({ isOpen: true, type: "error", title: "Missing Patient ID", message: "Please enter a Patient ID" });
      return;
    }

    setLoadingAudit(true);
    try {
      const result = await apiFetch(`/api/regulator/audit/${patientId.trim()}`);
      const audit = Array.isArray(result?.audit) ? (result.audit as AuditRecord[]) : [];
      setAuditData(audit);
      if (audit.length === 0) {
        setModal({ isOpen: true, type: "info", title: "No Records", message: `No audit records found for patient '${patientId.trim()}'` });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch audit";
      setModal({ isOpen: true, type: "error", title: "Audit Fetch Failed", message });
    } finally {
      setLoadingAudit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <OrgSidebar orgName="Regulator" portalLabel="Regulator Portal" navItems={regulatorNavItems} accentColor="orange" />
      <div className="lg:ml-56 min-h-screen bg-neutral-50 p-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 text-slate-900">
          <div className="mb-8">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-orange-600 mb-1">Regulator Portal</p>
            <h1 className="text-2xl font-black text-black tracking-tight leading-none">Audit Logs</h1>
            <p className="mt-1 text-sm text-black/60 font-medium">Inspect the access trail for any patient ID.</p>
          </div>

          <Card title="Find Audit Trail">
            <div className="grid gap-4 pt-2">
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-black/80">Patient ID</label>
                <Input
                  placeholder="e.g. patient-001"
                  value={patientId}
                  className="h-10 text-xs bg-neutral-50/50 border-none focus:ring-orange-600 placeholder:text-black/30"
                  onChange={(event) => setPatientId(event.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleViewAudit()}
                />
              </div>
              <Button
                size="sm"
                variant="none"
                onClick={handleViewAudit}
                className="h-9 text-[10px] bg-orange-600 text-white font-bold tracking-widest flex items-center justify-center gap-2 rounded-full"
                disabled={loadingAudit}
              >
                {loadingAudit ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Loading...
                  </>
                ) : "View Audit Trail"}
              </Button>
            </div>
          </Card>

          {auditData.length > 0 && (
            <Card title="Audit Records" className="mt-6">
              <div className="space-y-3 pt-2">
                {auditData.map((record, idx) => (
                  <div key={`${record.id}-${idx}`} className="flex items-start gap-3 p-3 bg-neutral-50/70 rounded-2xl border border-black/[0.04]">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${record.allowed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                      {record.allowed ? "✓" : "✗"}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-black">{record.action} - {record.allowed ? "Allowed" : "Denied"}</p>
                      <p className="text-[9px] text-black/60">Doctor: {record.doctorId} • Reason: {record.reason || "N/A"}</p>
                      <p className="text-[9px] text-black/40 mt-1">{record.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </>
  );
}
