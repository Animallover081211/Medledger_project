"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";

type ConsentEntry = {
  doctorId: string;
  grantedAt: number;
  status: string;
};

export default function ConsentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState<ConsentEntry[]>([]);
  const [revokeDoctorId, setRevokeDoctorId] = useState("");

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

  const fetchConsents = useCallback(async () => {
    try {
      const result = await apiFetch("/api/consents");
      setConsents(result.consents || []);
    } catch {
      showModal("error", "Error", "Failed to load consents from the ledger");
    } finally {
      setLoading(false);
    }
  }, [showModal]);

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "patient") {
      router.push("/");
      return;
    }
    fetchConsents();
  }, [router, fetchConsents]);

  const handleRevoke = async (doctorId: string) => {
    setRevokeDoctorId(doctorId);
    try {
      await apiFetch("/api/consent/revoke", {
        method: "POST",
        body: JSON.stringify({ doctorId }),
      });
      showModal("success", "Consent Revoked", `Access for doctor '${doctorId}' has been successfully removed from the ledger.`);
      fetchConsents();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke consent";
      showModal("error", "Revoke Failed", message);
    } finally {
      setRevokeDoctorId("");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/60">Access Controls</p>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none">Identity Consents</h1>
          <p className="mt-2 text-xs text-black/40 font-medium italic">Manage service providers who can inspect your medical history.</p>
        </div>

        {consents.length === 0 ? (
          <div className="border border-dashed border-black/10 rounded-3xl p-20 text-center bg-white/50">
            <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">🛡️</div>
            <p className="text-black font-bold text-sm mb-1">No Active Consents</p>
            <p className="text-black/30 text-[10px] font-medium tracking-wide">You haven&apos;t authorized any clinical providers yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {consents.map((consent) => (
              <div key={consent.doctorId} className="bg-white border border-black/[0.03] p-5 rounded-3xl flex items-center justify-between hover:shadow-xl hover:shadow-neutral-200/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform font-bold border border-black/[0.05]">
                    {consent.doctorId.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-black text-sm leading-none">{consent.doctorId}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-[9px] font-bold text-black/50 uppercase tracking-widest">{new Date(consent.grantedAt).toLocaleDateString()}</p>
                      <span className="w-1 h-1 bg-black/20 rounded-full"></span>
                      <span className="text-[9px] font-black uppercase text-emerald-600 tracking-tighter">Active Protocol</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRevoke(consent.doctorId)}
                  disabled={revokeDoctorId === consent.doctorId}
                  className="h-9 px-5 text-[9px] font-black uppercase tracking-widest border-black/5 hover:bg-black hover:text-white transition-all rounded-xl"
                >
                  {revokeDoctorId === consent.doctorId ? "Updating..." : "Revoke Access"}
                </Button>
              </div>
            ))}
          </div>
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
