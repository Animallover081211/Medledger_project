"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";

export default function DoctorPatientsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<string[]>([]);

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

    const closeModal = () => {
        setModal((prev) => ({ ...prev, isOpen: false }));
    };

    const fetchPatients = useCallback(async (role: "doctor" | "hospital") => {
        try {
            const result = await apiFetch(role === "hospital" ? "/api/hospital/patients" : "/api/doctor/patients");
            setPatients(result.patients || []);
        } catch {
            setPatients([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const identity = getIdentity();
        if (!identity || (identity.role !== "doctor" && identity.role !== "hospital")) {
            router.push("/");
            return;
        }
        fetchPatients(identity.role as "doctor" | "hospital");
    }, [router, fetchPatients]);

    const viewRecords = (pid: string) => {
        router.push(`/doctor/records/${pid}`);
    };

    if (loading) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.25)]"></span>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-700">Patient Registry</p>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-indigo-950 tracking-tight leading-none">Authorized Patients</h1>
                    <p className="mt-3 text-sm text-indigo-700/80 font-bold max-w-xl">
                        A directory of all patients who have granted your identity access to their medical history on the ledger.
                    </p>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {patients.length === 0 ? (
                        <div className="col-span-full border border-dashed border-indigo-200 rounded-[2.5rem] p-24 text-center bg-white/50">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">📪</div>
                            <p className="text-indigo-950 font-bold text-lg mb-1">No Authorized Access</p>
                            <p className="text-indigo-700/50 text-xs font-medium max-w-xs mx-auto">Patients must grant consent before they appear in your registry.</p>
                        </div>
                    ) : (
                        patients.map((pid) => (
                            <div
                                key={pid}
                                className="group relative bg-white border border-indigo-100 p-6 rounded-[2.5rem] text-left transition-all hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:bg-indigo-700 group-hover:text-white transition-all transform group-hover:rotate-6">
                                        {pid.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-indigo-950 mb-1 truncate">{pid}</h3>
                                <div className="flex flex-col gap-3 mt-6">
                                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-indigo-700/50 border-b border-indigo-100 pb-2">
                                        <span>Ledger ID</span>
                                        <span className="text-indigo-950 font-mono tracking-normal text-[11px] font-bold">{pid}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => viewRecords(pid)}
                                        className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-indigo-700 text-white hover:bg-indigo-800 transition-all rounded-2xl"
                                    >
                                        View Medical Records
                                    </Button>
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
