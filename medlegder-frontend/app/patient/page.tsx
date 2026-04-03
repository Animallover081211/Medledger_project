"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Modal } from "../components/ui/modal";
import { apiFetch } from "../../lib/api_client";
import { getIdentity } from "../../lib/identity";

type AuditLog = {
  id: string;
  patientId: string;
  doctorId: string;
  action: string;
  allowed: boolean;
  reason: string;
  timestamp: string;
  txId: string;
};

type DoctorOption = {
  id: string;
  name: string;
  role: "doctor" | "hospital";
  specialty: string;
};

const IDENTITY_RETRY_DELAY_MS = 250;
const IDENTITY_RETRY_ATTEMPTS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PatientPage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState("");
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [refreshingDoctors, setRefreshingDoctors] = useState(false);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [revokingAccess, setRevokingAccess] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

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

  const copyIdentityId = async () => {
    const value = patientId ?? "";
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      showModal("error", "Copy Failed", "Could not copy the ID to your clipboard");
    }
  };

  const fetchPatientInfo = useCallback(async () => {
    for (let attempt = 0; attempt < IDENTITY_RETRY_ATTEMPTS; attempt += 1) {
      try {
        const result = await apiFetch(`/api/identity/patient`);
        setPatientName(result.name);
        setLoading(false);
        return;
      } catch (err) {
        const status = (err as { status?: number }).status;
        const transientLookupFailure =
          status === 404 ||
          (err instanceof Error && /not registered|not found/i.test(err.message));
        if (!transientLookupFailure || attempt === IDENTITY_RETRY_ATTEMPTS - 1) {
          setPatientName(null);
          setLoading(false);
          return;
        }
        await sleep(IDENTITY_RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const result = await apiFetch("/api/access/request");
      setPendingRequests(result.requests || []);
    } catch {
      setPendingRequests([]);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const result = await apiFetch("/api/registry/doctors");
      const list = Array.isArray(result.doctors) ? result.doctors : [];
      setDoctors(list);
      setDoctorId((current) => current || list[0]?.id || "");
    } catch {
      setDoctors([]);
    }
  }, []);

  const refreshDoctors = async () => {
    setRefreshingDoctors(true);
    try {
      await fetchDoctors();
    } finally {
      setRefreshingDoctors(false);
    }
  };

  const handleAudit = useCallback(async () => {
    const identity = getIdentity();
    const id = identity?.id;
    if (!id) return;

    try {
      const result = await apiFetch(`/api/audit/${id}`);
      const data = result.audit || (Array.isArray(result) ? result : []);
      setAudit(data);
    } catch {
      // silently fail on auto-load
    }
  }, []);

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "patient") {
      router.push("/");
      return;
    }
    queueMicrotask(() => {
      setPatientId(identity?.id ?? null);
    });

    if (identity?.id) {
      fetchPatientInfo();
      fetchPendingRequests();
      fetchDoctors();
      apiFetch(`/api/audit/${identity.id}`)
        .then(result => {
          const data = result.audit || (Array.isArray(result) ? result : []);
          setAudit(data);
        })
        .catch(() => { });
    } else {
      queueMicrotask(() => setLoading(false));
    }
  }, [router, fetchPatientInfo, fetchPendingRequests, fetchDoctors]);


  const handleGrant = async () => {
    if (!doctorId.trim()) {
      showModal("error", "Missing Doctor ID", "Please enter a Doctor ID");
      return;
    }
    setGrantingAccess(true);
    try {
      await apiFetch("/api/consent/grant", {
        method: "POST",
        body: JSON.stringify({ doctorId: doctorId.trim() }),
      });
      showModal("success", "Consent Granted", `You have granted access to doctor '${doctorId}'`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to grant consent";
      showModal("error", "Grant Failed", message);
    } finally {
      setGrantingAccess(false);
    }
  };

  const handleRevoke = async () => {
    if (!doctorId.trim()) {
      showModal("error", "Missing Doctor ID", "Please enter a Doctor ID");
      return;
    }
    setRevokingAccess(true);
    try {
      await apiFetch("/api/consent/revoke", {
        method: "POST",
        body: JSON.stringify({ doctorId: doctorId.trim() }),
      });
      showModal("success", "Consent Revoked", `You have revoked access from doctor '${doctorId}'`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke consent";
      showModal("error", "Revoke Failed", message);
    } finally {
      setRevokingAccess(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: "accept" | "reject") => {
    setRespondingTo(requestId);
    try {
      await apiFetch("/api/access/respond", {
        method: "POST",
        body: JSON.stringify({ requestId, action }),
      });
      if (action === "accept") {
        showModal("success", "Request Accepted", "You have granted access to the doctor");
      } else {
        showModal("success", "Request Rejected", "You have rejected the access request");
      }
      fetchPendingRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to respond";
      showModal("error", "Error", message);
    } finally {
      setRespondingTo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patientName) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-8">
        <Card title="Not Registered">
          <p className="text-xs text-black/90 font-medium">
            You have not been registered on the blockchain yet. Please register first.
          </p>
        </Card>
      </div>
    );
  }

  const pending = pendingRequests.filter(r => r.status === "pending");
  const uniquePending = Object.values(pending.reduce((acc, req) => {
    if (!acc[req.doctor_id]) acc[req.doctor_id] = req;
    return acc;
  }, {} as Record<string, AccessRequest>));

  return (
    <>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-16">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full animate-pulse"></span>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-600">Patient Dashboard</p>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none">Welcome, {patientName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-black/60 font-mono">
            <span>Ledger ID: {patientId}</span>
            <Button type="button" variant="secondary" size="sm" className="h-8 px-3 text-[10px]" onClick={copyIdentityId}>
              {copyState === "copied" ? "Copied" : "Copy ID"}
            </Button>
          </div>
        </div>

        {pending.length > 0 && (
          <Card title="Incoming Requests" className="mb-6 border-emerald-100 bg-emerald-50/10">
            <div className="space-y-2">
              {uniquePending.map((req) => (
                <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white rounded-2xl border border-emerald-100 shadow-sm gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-lg shadow-inner">👨‍⚕️</div>
                    <div>
                      <p className="text-xs font-bold text-black leading-none">{req.doctor_id}</p>
                      <p className="text-[9px] text-black/60 mt-1 font-semibold italic">Wants access to your records</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none h-8 px-4 text-[10px] bg-black hover:bg-neutral-800 transition-all font-black uppercase tracking-widest flex items-center justify-center gap-1"
                      onClick={() => handleRespondToRequest(req.id, "accept")}
                      disabled={respondingTo === req.id}
                    >
                      {respondingTo === req.id ? (
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : "Allow"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 sm:flex-none h-8 px-4 text-[10px] border-black/10 font-bold uppercase flex items-center justify-center gap-1"
                      onClick={() => handleRespondToRequest(req.id, "reject")}
                      disabled={respondingTo === req.id}
                    >
                      {respondingTo === req.id ? (
                        <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : "Deny"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <Card title="Manage Consents">
            <div className="grid gap-4 pt-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-black/80">Doctor Identity</label>
                  <button
                    type="button"
                    onClick={refreshDoctors}
                    disabled={refreshingDoctors}
                    className="text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <span className={refreshingDoctors ? "animate-spin" : ""}>↻</span> Refresh
                  </button>
                </div>
                <Select
                  value={doctorId}
                  onChange={(event) => setDoctorId(event.target.value)}
                  className="h-10 text-xs bg-neutral-50 border-none focus:ring-black"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="none"
                  onClick={handleGrant}
                  className="h-9 text-[10px] bg-black text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-full"
                  disabled={grantingAccess}
                >
                  {grantingAccess ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Granting...
                    </>
                  ) : "Grant Access"}
                </Button>
                <Button
                  size="sm"
                  variant="none"
                  onClick={handleRevoke}
                  className="h-9 text-[10px] bg-white text-black border border-black/15 font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-full"
                  disabled={revokingAccess}
                >
                  {revokingAccess ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Wait...
                    </>
                  ) : "Revoke Access"}
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Audit Overview">
            <div className="flex flex-col h-full justify-between pt-2">
              <p className="text-[11px] text-black/70 leading-relaxed font-semibold mb-4 italic">
                Monitor all ledger interactions. Every time a doctor requests access or you change consent settings, it is immutably logged.
              </p>
              <Button size="sm" variant="none" onClick={handleAudit} className="h-9 text-[10px] bg-black text-white font-black uppercase tracking-widest rounded-full">Sync Audit Log</Button>
            </div>
          </Card>
        </div>

        <Card title="Audit History">
          <div className="overflow-y-auto pt-2 min-h-[360px] sm:min-h-[400px] max-h-[600px] scrollbar-hide">
            {!Array.isArray(audit) || audit.length === 0 ? (
              <div className="flex items-center justify-center min-h-[360px] sm:min-h-[400px]">
                <p className="text-[11px] text-black/50 font-bold uppercase tracking-[0.2em]">Log is empty</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul role="list" className="-my-4 divide-y divide-black/[0.03]">
                  {[...audit].reverse().map((log) => (
                    <li key={log.txId} className="py-4 last:pb-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${log.action === 'GRANT' ? 'bg-emerald-100 text-emerald-700' :
                            log.action === 'REVOKE' ? 'bg-red-100 text-red-700' :
                              log.action === 'REQUEST' ? 'bg-blue-100 text-blue-700' :
                                'bg-neutral-100 text-neutral-600'
                            }`}>
                            {log.action}
                          </span>
                          <p className="text-[11px] font-black text-black truncate max-w-[120px]">
                            {log.doctorId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-black leading-none">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-[8px] text-black/60 font-bold mt-1">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="bg-neutral-50/50 p-2.5 rounded-xl border border-black/[0.05]">
                        <p className="text-[10px] text-black/80 leading-relaxed font-semibold">
                          <span className="text-black/50 text-[9px] font-black uppercase mr-1">Reason:</span>
                          {log.reason.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type === 'info' ? 'info' : modal.type}
      />
    </>
  );
}

type AccessRequest = {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: string;
  created_at: number;
};
