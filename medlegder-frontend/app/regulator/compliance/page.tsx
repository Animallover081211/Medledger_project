"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar, type NavItem } from "../../components/layout/org_sidebar";
import { Card } from "../../components/ui/card";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";

type ComplianceReport = {
  summary: {
    totalActions: number;
    granted: number;
    revoked: number;
    emergencyAccess: number;
    pendingRequests: number;
  };
  compliance: {
    hipaaCompliant: boolean;
    lastAudit: string;
    issuesFound: number;
  };
  alerts: Array<{ message: string; severity: string }>;
};

const regulatorNavItems: NavItem[] = [
  { href: "/regulator", label: "Dashboard", icon: <span>▣</span> },
  { href: "/regulator/users", label: "Users", icon: <span>👥</span> },
  { href: "/regulator/audit", label: "Audit Logs", icon: <span>🧾</span> },
  { href: "/regulator/compliance", label: "Compliance", icon: <span>🛡</span> },
];

export default function RegulatorCompliancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ComplianceReport | null>(null);

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "regulator") {
      router.push("/");
      return;
    }

    const load = async () => {
      try {
        const result = await apiFetch("/api/regulator/compliance");
        setReport(result as ComplianceReport);
      } catch {
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

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
      <div className="lg:ml-56 min-h-screen bg-neutral-50 p-6 pt-24 lg:pt-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-slate-900">
          <div className="mb-8">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-orange-600 mb-1">Regulator Portal</p>
            <h1 className="text-2xl font-black text-black tracking-tight leading-none">Compliance Overview</h1>
            <p className="mt-1 text-sm text-black/60 font-medium">Current compliance posture based on audit activity.</p>
          </div>

          {report ? (
            <>
              <Card title="Summary">
                <div className="grid gap-4 pt-2 md:grid-cols-4">
                  <div className="rounded-2xl border border-black/[0.04] bg-white p-4">
                    <p className="text-2xl font-black text-black">{report.summary.totalActions}</p>
                    <p className="text-[9px] uppercase tracking-wider text-black/50 font-bold">Total Actions</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-2xl font-black text-emerald-600">{report.summary.granted}</p>
                    <p className="text-[9px] uppercase tracking-wider text-emerald-700 font-bold">Granted</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-2xl font-black text-amber-600">{report.summary.pendingRequests}</p>
                    <p className="text-[9px] uppercase tracking-wider text-amber-700 font-bold">Pending</p>
                  </div>
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-2xl font-black text-red-600">{report.summary.revoked}</p>
                    <p className="text-[9px] uppercase tracking-wider text-red-700 font-bold">Revoked</p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <Card title="Compliance Status">
                  <div className="grid gap-3 pt-2 text-sm">
                    <p><span className="font-black">HIPAA Compliant:</span> {report.compliance.hipaaCompliant ? "Yes" : "No"}</p>
                    <p><span className="font-black">Last Audit:</span> {new Date(report.compliance.lastAudit).toLocaleString()}</p>
                    <p><span className="font-black">Issues Found:</span> {report.compliance.issuesFound}</p>
                    <p><span className="font-black">Emergency Access:</span> {report.summary.emergencyAccess}</p>
                  </div>
                </Card>

                <Card title="Alerts">
                  <div className="space-y-3 pt-2">
                    {report.alerts.length > 0 ? (
                      report.alerts.map((alert, index) => (
                        <div key={`${alert.message}-${index}`} className="rounded-2xl border border-black/[0.04] bg-white p-4">
                          <p className="text-sm font-black text-black">{alert.severity}</p>
                          <p className="text-xs text-black/60 mt-1">{alert.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-black/50 font-medium">No active compliance alerts.</p>
                    )}
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <Card title="Compliance Status">
              <p className="text-sm text-black/50 font-medium pt-2">Unable to load compliance data.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
