"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar, type NavItem } from "../components/layout/org_sidebar";
import { Card } from "../components/ui/card";
import { apiFetch } from "../../lib/api_client";
import { getIdentity } from "../../lib/identity";

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
  {
    href: "/regulator",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/regulator/audit",
    label: "Audit Logs",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/regulator/compliance",
    label: "Compliance",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function RegulatorPage() {
  const router = useRouter();
  const [regulatorId, setRegulatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCompliance, setLoadingCompliance] = useState(true);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "regulator") {
      router.push("/");
      return;
    }
    queueMicrotask(() => {
      setRegulatorId(identity?.id ?? null);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    const loadCompliance = async () => {
      try {
        const result = await apiFetch("/api/regulator/compliance");
        setComplianceReport(result as ComplianceReport);
      } catch {
        setComplianceReport(null);
      } finally {
        setLoadingCompliance(false);
      }
    };

    loadCompliance();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <OrgSidebar
        orgName="Regulator"
        portalLabel="Regulator Portal"
        navItems={regulatorNavItems}
        accentColor="orange"
      />
      <div className="lg:ml-56 min-h-screen bg-neutral-50 p-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 text-slate-900">
          <div className="mb-8 font-medium">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,88,6,0.3)]"></span>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-orange-600">Regulator Portal</p>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none">Compliance Dashboard</h1>
            <p className="mt-1 text-sm text-black/60 font-medium">Regulator ID: {regulatorId}</p>
          </div>

          <div className="grid gap-6 mb-8">
            <Card title="Compliance Overview">
              {loadingCompliance ? (
                <p className="text-xs text-black/50 font-medium pt-2">Loading compliance snapshot...</p>
              ) : complianceReport ? (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-2xl font-black text-emerald-600">{complianceReport.summary.granted}</p>
                    <p className="text-[9px] uppercase tracking-wider text-emerald-700 font-bold">Granted</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-2xl font-black text-amber-600">{complianceReport.summary.pendingRequests}</p>
                    <p className="text-[9px] uppercase tracking-wider text-amber-700 font-bold">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-2xl font-black text-orange-600">{complianceReport.summary.emergencyAccess}</p>
                    <p className="text-[9px] uppercase tracking-wider text-orange-700 font-bold">Emergency</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-2xl font-black text-red-600">{complianceReport.compliance.issuesFound}</p>
                    <p className="text-[9px] uppercase tracking-wider text-red-700 font-bold">Issues</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-black/50 font-medium pt-2">Compliance data unavailable.</p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Link href="/regulator/audit" className="flex items-center justify-between gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100 hover:bg-orange-100 transition-colors">
              <div>
                <p className="text-xs font-bold text-black">Open Audit Logs</p>
                <p className="text-[9px] text-black/60">Search and inspect patient audit trails</p>
              </div>
              <span className="text-orange-700 text-lg">→</span>
            </Link>
            <Link href="/regulator/compliance" className="flex items-center justify-between gap-3 p-4 bg-neutral-50 rounded-2xl border border-black/5 hover:bg-neutral-100 transition-colors">
              <div>
                <p className="text-xs font-bold text-black">Full Compliance Report</p>
                <p className="text-[9px] text-black/60">View the current compliance snapshot</p>
              </div>
              <span className="text-black/50 text-lg">→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
