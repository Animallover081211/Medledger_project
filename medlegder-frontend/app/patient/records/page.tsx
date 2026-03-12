"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";
import { Modal } from "../../components/ui/modal";

type MedicalRecord = {
    id: string;
    patient_id: string;
    record_type: string;
    payload: string;
    created_at: number;
};

const RenderPayload = ({ data }: { data: Record<string, unknown> | unknown }) => {
    if (typeof data !== 'object' || data === null) {
        return <p className="text-xs text-black/90 leading-relaxed p-4 bg-neutral-50 rounded-2xl border border-black/10">{String(data)}</p>;
    }

    return (
        <div className="grid gap-2">
            {Object.entries(data as Record<string, unknown>).map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                return (
                    <div key={key} className="flex justify-between items-center px-4 py-3 bg-neutral-50/50 border border-black/[0.08] rounded-2xl transition-colors hover:bg-white group/item">
                        <span className="text-[9px] font-bold text-black/50 uppercase tracking-wider group-hover/item:text-black/70 transition-colors">{label}</span>
                        <span className="text-[11px] font-extrabold text-black">{String(value)}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default function MyRecordsPage() {
    const router = useRouter();
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

    const fetchRecords = useCallback(async (pid: string) => {
        try {
            const result = await apiFetch(`/api/records/${pid}`);
            if (result.records) {
                setRecords(result.records);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch records";
            showModal("error", "Sync Error", message);
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
        fetchRecords(identity.id);
    }, [router, fetchRecords]);

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
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/60">My Health Ledger</p>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none uppercase">Medical History</h1>
                    <p className="mt-2 text-xs text-black/40 font-medium italic">Immutable transcript of your clinical records.</p>
                </div>

                <div className="grid gap-6">
                    {records.length === 0 ? (
                        <div className="border border-dashed border-black/10 rounded-3xl p-20 text-center bg-white/50">
                            <p className="text-black/30 text-[11px] font-bold uppercase tracking-widest">No records found on the ledger</p>
                        </div>
                    ) : (
                        records.sort((a, b) => b.created_at - a.created_at).map((rec) => (
                            <div
                                key={rec.id}
                                className="bg-white border border-black/[0.03] overflow-hidden rounded-[2.5rem] hover:shadow-2xl hover:shadow-neutral-200/50 transition-all group"
                            >
                                <div className="p-6 border-b border-black/[0.03] bg-neutral-50/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform border border-black/[0.03]">
                                            {rec.record_type.toLowerCase().includes('report') ? '📋' : '📄'}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-black text-sm leading-none uppercase tracking-tight">{rec.record_type}</h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                                                <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                                                    {new Date(rec.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-full">
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
