"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";
import { Modal } from "../../components/ui/modal";
import { Select } from "../../components/ui/select";
import { copyToClipboard } from "../../../lib/client/clipboard";

type MedicalRecord = {
    id: string;
    patient_id: string;
    record_type: string;
    payload: string;
    created_at: number;
};

const RenderPayload = ({ data }: { data: Record<string, unknown> | unknown }) => {
    const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

    const copyValue = async (value: string) => {
        try {
            const copied = await copyToClipboard(value);
            if (!copied) {
                throw new Error("Clipboard copy failed");
            }
            setCopyState("copied");
            window.setTimeout(() => setCopyState("idle"), 1500);
        } catch {
            // ignore copy errors in the inline payload view
        }
    };

    if (typeof data !== 'object' || data === null) {
        return <p className="text-xs text-black/90 leading-relaxed p-4 bg-neutral-50 rounded-2xl border border-black/10">{String(data)}</p>;
    }

    return (
        <div className="grid gap-2">
            {Object.entries(data as Record<string, unknown>).map(([key, value]) => {
                const label = key === "RxNumber"
                    ? "RX NUMBER"
                    : key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                const renderedValue = key === "RxNumber" ? String(value).toUpperCase() : String(value);
                const isRxNumber = key === "RxNumber";
                return (
                    <div key={key} className="flex justify-between items-center gap-3 px-4 py-3 bg-neutral-50/50 border border-black/[0.08] rounded-2xl transition-colors hover:bg-white group/item">
                        <span className="text-[9px] font-bold text-black/50 uppercase tracking-wider group-hover/item:text-black/70 transition-colors">{label}</span>
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-extrabold text-black break-all text-right">{renderedValue}</span>
                            {isRxNumber && (
                                <button
                                    type="button"
                                    onClick={() => copyValue(renderedValue)}
                                    className="shrink-0 rounded-full border border-black/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-black/60 hover:bg-black hover:text-white transition-colors"
                                >
                                    {copyState === "copied" ? "Copied" : "Copy"}
                                </button>
                            )}
                        </div>
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
    const [recordTypeFilter, setRecordTypeFilter] = useState("all");

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

    const recordTypes = Array.from(new Set(records.map((record) => record.record_type))).sort();
    const visibleRecords = [...records]
        .sort((a, b) => b.created_at - a.created_at)
        .filter((record) => recordTypeFilter === "all" || record.record_type === recordTypeFilter);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/60">My Health Ledger</p>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none uppercase">Medical History</h1>
                    <p className="mt-2 text-xs text-black/40 font-medium italic">Immutable transcript of your clinical records.</p>
                </div>

                <div className="mb-6 rounded-[2rem] border border-black/5 bg-white p-3 sm:p-4 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex-1">
                            <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-black/60">Filter By Record Type</label>
                            <Select value={recordTypeFilter} onChange={(e) => setRecordTypeFilter(e.target.value)} className="h-10 text-xs">
                                <option value="all">All Types</option>
                                {recordTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                            Showing {visibleRecords.length} of {records.length}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6">
                    {records.length === 0 ? (
                        <div className="border border-dashed border-black/10 rounded-3xl p-20 text-center bg-white/50">
                            <p className="text-black/30 text-[11px] font-bold uppercase tracking-widest">No records found on the ledger</p>
                        </div>
                    ) : visibleRecords.length === 0 ? (
                        <div className="border border-dashed border-black/10 rounded-3xl p-20 text-center bg-white/50">
                            <p className="text-black/30 text-[11px] font-bold uppercase tracking-widest">No records match this type</p>
                        </div>
                    ) : (
                        visibleRecords.map((rec) => (
                            <div
                                key={rec.id}
                                className="bg-white border border-black/[0.03] overflow-hidden rounded-[2.5rem] hover:shadow-2xl hover:shadow-neutral-200/50 transition-all group"
                            >
                                <div className="p-4 sm:p-6 border-b border-black/[0.03] bg-neutral-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform border border-black/[0.03]">
                                            {rec.record_type.toLowerCase().includes('report') ? '📋' : '📄'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-black text-black text-sm leading-none uppercase tracking-tight">{rec.record_type}</h4>
                                            <div className="flex items-center gap-2 mt-2 min-w-0">
                                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                                                <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest truncate">
                                                    {new Date(rec.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-auto px-3 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-full text-center sm:text-left self-stretch sm:self-auto">
                                        Ledger Verified
                                    </div>
                                </div>
                                <div className="p-4 sm:p-6 bg-white">
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
