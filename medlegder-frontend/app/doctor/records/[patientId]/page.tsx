"use client";

import { useEffect, useState, useCallback, ReactNode, use } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../../../components/ui/modal";
import { apiFetch } from "../../../../lib/api_client";
import { getIdentity } from "../../../../lib/identity";

type MedicalRecord = {
    id: string;
    patient_id: string;
    record_type: string;
    payload: string;
    created_at: number;
};

const RenderPayload = ({ data }: { data: Record<string, unknown> | unknown }) => {
    if (typeof data !== 'object' || data === null) {
        return <p className="text-xs text-indigo-950/90 leading-relaxed p-4 bg-indigo-50 rounded-2xl border border-indigo-100">{String(data)}</p>;
    }

    return (
        <div className="grid gap-2">
            {Object.entries(data as Record<string, unknown>).map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                return (
                    <div key={key} className="flex justify-between items-center px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl transition-colors hover:bg-white group/item">
                        <span className="text-[9px] font-bold text-indigo-700/50 uppercase tracking-wider group-hover/item:text-indigo-700 transition-colors">{label}</span>
                        <span className="text-[11px] font-extrabold text-indigo-950">{String(value)}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default function PatientRecordsPage({ params }: { params: Promise<{ patientId: string }> }) {
    const router = useRouter();
    const { patientId } = use(params);
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<MedicalRecord[]>([]);

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

    const fetchRecords = useCallback(async () => {
        try {
            const result = await apiFetch(`/api/records/${patientId}`);
            if (result.allowed && result.records) {
                setRecords(result.records);
            } else {
                showModal("error", "Access Denied", "You do not have permission to view records for this patient.");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch records";
            showModal("error", "Sync Error", message);
        } finally {
            setLoading(false);
        }
    }, [patientId, showModal]);

    useEffect(() => {
        const identity = getIdentity();
        if (!identity || ((identity.role !== "doctor" && identity.role !== "hospital") && (identity.role !== "patient" || identity.id !== patientId))) {
            router.push("/");
            return;
        }
        fetchRecords();
    }, [router, fetchRecords, patientId]);

    const formatPayload = (payload: string) => {
        try {
            return JSON.parse(payload);
        } catch {
            return payload;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-700/50 hover:text-indigo-700 transition-colors mb-4 group"
                    >
                        <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-indigo-700">Clinical Record Ledger</p>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight leading-none uppercase">{patientId}</h1>
                </div>

                <div className="grid gap-6">
                    {records.length === 0 ? (
                        <div className="border border-dashed border-indigo-200 rounded-3xl p-20 text-center bg-white/50">
                            <p className="text-indigo-700/30 text-[11px] font-bold uppercase tracking-widest">No records found on the ledger</p>
                        </div>
                    ) : (
                        records.sort((a, b) => b.created_at - a.created_at).map((rec) => (
                            <div
                                key={rec.id}
                                className="bg-white border border-indigo-100 overflow-hidden rounded-[2.5rem] hover:shadow-2xl hover:shadow-indigo-100 transition-all group"
                            >
                                <div className="p-6 border-b border-indigo-100 bg-indigo-50/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform border border-indigo-100">
                                            {rec.record_type.toLowerCase().includes('report') ? '📋' : '📄'}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-indigo-950 text-sm leading-none uppercase tracking-tight">{rec.record_type}</h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="w-1 h-1 bg-indigo-600 rounded-full animate-pulse"></span>
                                                <p className="text-[10px] font-bold text-indigo-700/60 uppercase tracking-widest">
                                                    {new Date(rec.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1.5 bg-indigo-700 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                                        Ledger Verified
                                    </div>
                                </div>
                                <div className="p-6 bg-white">
                                    <RenderPayload data={formatPayload(rec.payload)} />
                                </div>
                            </div>
                        ))
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
