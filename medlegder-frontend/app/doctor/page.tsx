"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Modal } from "../components/ui/modal";
import { apiFetch } from "../../lib/api_client";
import { getIdentity } from "../../lib/identity";
import { copyToClipboard } from "../../lib/client/clipboard";

const IDENTITY_RETRY_DELAY_MS = 250;
const IDENTITY_RETRY_ATTEMPTS = 5;
type ProviderRole = "doctor" | "hospital";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function DoctorPage() {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [doctorSpecialty, setDoctorSpecialty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [reason, setReason] = useState("");
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [loggingEmergency, setLoggingEmergency] = useState(false);
  const [refreshingPatients, setRefreshingPatients] = useState(false);
  const [grantedPatients, setGrantedPatients] = useState<Array<{ id: string; name: string }>>([]);
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
    const value = doctorId ?? "";
    if (!value) return;
    try {
      const copied = await copyToClipboard(value);
      if (!copied) {
        throw new Error("Clipboard copy failed");
      }
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      showModal("error", "Copy Failed", "Could not copy the ID to your clipboard");
    }
  };

  const fetchDoctorInfo = useCallback(async (role: ProviderRole) => {
    for (let attempt = 0; attempt < IDENTITY_RETRY_ATTEMPTS; attempt += 1) {
      try {
        const result = await apiFetch(`/api/identity/${role}`);
        setDoctorName(result.name);
        setDoctorSpecialty(result.specialty);
        setLoading(false);
        return;
      } catch (err) {
        const status = (err as { status?: number }).status;
        const transientLookupFailure =
          status === 404 ||
          (err instanceof Error && /not registered|not found/i.test(err.message));
        if (!transientLookupFailure || attempt === IDENTITY_RETRY_ATTEMPTS - 1) {
          setDoctorName(null);
          setLoading(false);
          return;
        }
        await sleep(IDENTITY_RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const result = await apiFetch("/api/registry/patients");
      const list = Array.isArray(result.patients) ? result.patients : [];
      setPatients(list);
      setPatientId((current) => current || list[0]?.id || "");
    } catch {
      setPatients([]);
    }
  }, []);

  const refreshPatients = async () => {
    setRefreshingPatients(true);
    try {
      await fetchPatients();
    } finally {
      setRefreshingPatients(false);
    }
  };

  const normalizePatients = (items: Array<string | { id: string; name: string }> | undefined) =>
    (Array.isArray(items) ? items : [])
      .map((item) => {
        if (typeof item === "string") {
          return { id: item, name: item };
        }
        return item && item.id ? item : null;
      })
      .filter((item): item is { id: string; name: string } => Boolean(item?.id));

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || (identity.role !== "doctor" && identity.role !== "hospital")) {
      router.push("/");
      return;
    }
    const role = identity.role as ProviderRole;
    queueMicrotask(() => {
      setDoctorId(identity?.id ?? null);
    });

    if (identity?.id) {
      fetchDoctorInfo(role);
      fetchPatients();
      // Fetch granted patients inline to avoid dependency loop
      apiFetch(role === "hospital" ? "/api/hospital/patients" : "/api/doctor/patients")
        .then(result => setGrantedPatients(normalizePatients(result.patients)))
        .catch(() => { });
    } else {
      queueMicrotask(() => setLoading(false));
    }
  }, [router, fetchDoctorInfo, fetchPatients]);

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
      <div className="flex h-[40vh] items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctorName) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-8">
        <Card title="Not Registered">
          <p className="text-xs text-indigo-950/90 text-center py-4 font-medium">
            Identification missing from ledger registry.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 text-slate-900">
        <div className="mb-8 font-medium">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.25)]"></span>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-indigo-700">Provider Portal</p>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight leading-none">Dr. {doctorName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-indigo-700 font-medium">
            <span>{doctorSpecialty} • ID: {doctorId}</span>
            <Button type="button" variant="secondary" size="sm" className="h-8 px-3 text-[10px] border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100" onClick={copyIdentityId}>
              {copyState === "copied" ? "Copied" : "Copy ID"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card title="Registry Request">
            <div className="grid gap-4 pt-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-indigo-900/80">Target Patient</label>
                  <button
                    type="button"
                    onClick={refreshPatients}
                    disabled={refreshingPatients}
                    className="text-[9px] font-black uppercase tracking-widest text-indigo-600/60 hover:text-indigo-700 transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <span className={refreshingPatients ? "animate-spin" : ""}>↻</span> Refresh
                  </button>
                </div>
                <Select
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                  className="h-10 text-xs bg-indigo-50 border-none focus:ring-indigo-500"
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                size="sm"
                variant="none"
                onClick={handleRequestAccess}
                className="h-9 text-[10px] bg-black text-white font-bold tracking-widest flex items-center justify-center gap-2 rounded-full"
                disabled={requestingAccess}
              >
                {requestingAccess ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : "Send Access Request"}
              </Button>
              <p className="text-[9px] text-indigo-700/60 font-medium italic text-center">Sends an authorization hook to the patient.</p>
            </div>
          </Card>

          <Card title="Override Access">
            <div className="grid gap-4 pt-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-indigo-900/80">Patient</label>
                  <button
                    type="button"
                    onClick={refreshPatients}
                    disabled={refreshingPatients}
                    className="text-[9px] font-black uppercase tracking-widest text-indigo-600/60 hover:text-indigo-700 transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <span className={refreshingPatients ? "animate-spin" : ""}>↻</span> Refresh
                  </button>
                </div>
                <Select
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                  className="h-10 text-xs bg-indigo-50 border-none focus:ring-indigo-500"
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-indigo-900/80">Justification</label>
                <Input
                  placeholder="Reason for emergency..."
                  value={reason}
                  className="h-10 text-xs bg-indigo-50/50 border-none focus:ring-indigo-500 placeholder:text-indigo-300"
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
              <Button
                size="sm"
                variant="none"
                onClick={handleEmergency}
                className="h-9 text-[10px] bg-white text-indigo-950 border border-indigo-200 font-bold tracking-widest uppercase flex items-center justify-center gap-2 rounded-full"
                disabled={loggingEmergency}
              >
                {loggingEmergency ? (
                  <>
                    <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-700 rounded-full animate-spin" />
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
              {grantedPatients.map((patient) => (
                <div key={patient.id} className="flex items-center gap-3 p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                  <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-base">🧑‍⚕️</div>
                  <div>
                    <p className="text-xs font-bold text-indigo-950 leading-none">{patient.name}</p>
                    <p className="text-[9px] text-indigo-700/60 mt-1 font-mono tracking-normal">{patient.id}</p>
                    <p className="text-[9px] text-indigo-600 mt-1 font-black uppercase tracking-wider">✓ Access Granted</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
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
