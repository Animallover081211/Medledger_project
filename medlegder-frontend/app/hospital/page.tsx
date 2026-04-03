"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar, type NavItem } from "../components/layout/org_sidebar";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/modal";
import { apiFetch } from "../../lib/api_client";
import { getIdentity } from "../../lib/identity";

const hospitalNavItems: NavItem[] = [
  {
    href: "/hospital",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/hospital/create-record",
    label: "Create Record",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: "/hospital/patients",
    label: "My Patients",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export default function HospitalPage() {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [doctorSpecialty, setDoctorSpecialty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [reason, setReason] = useState("");
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [loggingEmergency, setLoggingEmergency] = useState(false);
  const [grantedPatients, setGrantedPatients] = useState<string[]>([]);

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

  const fetchDoctorInfo = useCallback(async () => {
    try {
      const result = await apiFetch(`/api/identity/doctor`);
      setDoctorName(result.name);
      setDoctorSpecialty(result.specialty);
    } catch {
      setDoctorName(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "doctor") {
      router.push("/");
      return;
    }
    queueMicrotask(() => {
      setDoctorId(identity?.id ?? null);
    });

    if (identity?.id) {
      fetchDoctorInfo();
      apiFetch("/api/doctor/patients")
        .then(result => setGrantedPatients(result.patients || []))
        .catch(() => { });
    } else {
      queueMicrotask(() => setLoading(false));
    }
  }, [router, fetchDoctorInfo]);

  const handleRequestAccess = async () => {
    if (!patientId.trim()) {
      showModal("error", "Missing Patient ID", "Please enter a Patient ID");
      return;
    }
    setRequestingAccess(true);
    try {
      const result = await apiFetch("/api/access/request", {
        method: "POST",
        body: JSON.stringify({ patientId: patientId.trim() }),
      });
      if (result.status === "pending") {
        showModal("success", "Request Sent", `Your access request has been sent to patient '${patientId}'`);
      } else if (result.allowed) {
        showModal("success", "Access Approved", `You have been granted access to patient '${patientId}'`);
      } else {
        showModal("error", "Access Denied", "Patient has not granted consent yet");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Access request failed";
      showModal("error", "Request Failed", message);
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleEmergency = async () => {
    if (!patientId.trim()) {
      showModal("error", "Missing Patient ID", "Please enter a Patient ID");
      return;
    }
    if (!reason.trim()) {
      showModal("error", "Missing Reason", "Please enter a reason for emergency access");
      return;
    }
    setLoggingEmergency(true);
    try {
      await apiFetch("/api/access/emergency", {
        method: "POST",
        body: JSON.stringify({ patientId: patientId.trim(), reason: reason.trim() }),
      });
      showModal("success", "Emergency Logged", "Emergency access has been recorded on the blockchain");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Emergency access failed";
      showModal("error", "Emergency Failed", message);
    } finally {
      setLoggingEmergency(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctorName) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-8">
        <Card title="Not Registered">
          <p className="text-xs text-black/90 text-center py-4 font-medium">
            Hospital staff not found in ledger registry.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <OrgSidebar
        orgName="Hospital"
        portalLabel="Hospital Portal"
        navItems={hospitalNavItems}
        accentColor="blue"
      />
      <div className="lg:ml-56 min-h-screen bg-neutral-50 p-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 text-slate-900">
          <div className="mb-8 font-medium">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.3)]"></span>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-blue-600">Hospital Portal</p>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none">Dr. {doctorName}</h1>
            <p className="mt-1 text-sm text-black/60 font-medium">{doctorSpecialty} • ID: {doctorId}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card title="Access Request">
              <div className="grid gap-4 pt-2">
                <div>
                  <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-black/80">Target Patient ID</label>
                  <Input
                    placeholder="e.g. patient-201"
                    value={patientId}
                    className="h-10 text-xs bg-neutral-50/50 border-none focus:ring-blue-600 placeholder:text-black/30"
                    onChange={(event) => setPatientId(event.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="none"
                  onClick={handleRequestAccess}
                  className="h-9 text-[10px] bg-blue-600 text-white font-bold tracking-widest flex items-center justify-center gap-2 rounded-full"
                  disabled={requestingAccess}
                >
                  {requestingAccess ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : "Send Access Request"}
                </Button>
                <p className="text-[9px] text-black/60 font-medium italic text-center">Sends an authorization hook to the patient.</p>
              </div>
            </Card>

            <Card title="Override Access">
              <div className="grid gap-4 pt-2">
                <div>
                  <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-black/80">Patient ID</label>
                  <Input
                    placeholder="e.g. patient-201"
                    value={patientId}
                    className="h-10 text-xs bg-neutral-50/50 border-none focus:ring-blue-600 placeholder:text-black/30"
                    onChange={(event) => setPatientId(event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-black/80">Justification</label>
                  <Input
                    placeholder="Reason for emergency..."
                    value={reason}
                    className="h-10 text-xs bg-neutral-50/50 border-none focus:ring-blue-600 placeholder:text-black/30"
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="none"
                  onClick={handleEmergency}
                  className="h-9 text-[10px] bg-white text-blue-600 border border-blue-200 font-bold tracking-widest uppercase flex items-center justify-center gap-2 rounded-full"
                  disabled={loggingEmergency}
                >
                  {loggingEmergency ? (
                    <>
                      <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      Logging...
                    </>
                  ) : <span>Log Emergency Access</span>}
                </Button>
              </div>
            </Card>
          </div>

          {grantedPatients.length > 0 && (
            <Card title="Granted Consents" className="mt-4">
              <div className="space-y-2 pt-2">
                <p className="text-[10px] text-black/50 font-semibold italic mb-3">
                  Patients who have directly granted you access to their records.
                </p>
                {grantedPatients.map((pid) => (
                  <div key={pid} className="flex items-center gap-3 p-3 bg-neutral-50/70 rounded-2xl border border-black/[0.04]">
                    <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-base">🏥</div>
                    <div>
                      <p className="text-xs font-bold text-black leading-none">{pid}</p>
                      <p className="text-[9px] text-blue-600 mt-1 font-black uppercase tracking-wider">✓ Access Granted</p>
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
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </>
  );
}
