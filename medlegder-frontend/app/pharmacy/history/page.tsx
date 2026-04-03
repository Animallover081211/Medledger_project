"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar, type NavItem } from "../../components/layout/org_sidebar";
import { Card } from "../../components/ui/card";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";

type HistoryRecord = {
  rxNumber: string;
  verificationStatus: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  dispensedAt: string | null;
  dispensedBy: string | null;
};

const pharmacyNavItems: NavItem[] = [
  { href: "/pharmacy", label: "Dashboard", icon: <span>▣</span> },
  { href: "/pharmacy/verify", label: "Verify Rx", icon: <span>✓</span> },
  { href: "/pharmacy/history", label: "History", icon: <span>📋</span> },
];

export default function PharmacyHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "pharmacy") {
      router.push("/");
      return;
    }

    const load = async () => {
      try {
        const result = await apiFetch("/api/pharmacy/history");
        setHistory(Array.isArray(result?.history) ? result.history : []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-slate-900">
          <div className="mb-8">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-purple-600 mb-1">Pharmacy Portal</p>
            <h1 className="text-2xl font-black text-black tracking-tight leading-none">Prescription History</h1>
            <p className="mt-1 text-sm text-black/60 font-medium">Verified and dispensed prescriptions in one timeline.</p>
          </div>

          <Card title="Verification and Dispensing History">
            <div className="space-y-3 pt-2">
              {history.length > 0 ? (
                history.map((record, index) => (
                  <div key={`${record.rxNumber}-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-black/[0.04]">
                    <div>
                      <p className="text-sm font-black text-black">{record.rxNumber}</p>
                      <p className="text-[10px] text-black/40">
                        Status: {record.verificationStatus} • Verified by: {record.verifiedBy || "N/A"}{record.dispensedBy ? ` • Dispensed by: ${record.dispensedBy}` : ""}
                      </p>
                    </div>
                    <p className="text-[10px] text-black/50">
                      {record.dispensedAt
                        ? new Date(record.dispensedAt).toLocaleString()
                        : record.verifiedAt
                          ? new Date(record.verifiedAt).toLocaleString()
                          : "Pending"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-black/50 font-medium">No prescription history available.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
