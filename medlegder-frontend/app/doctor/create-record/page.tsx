"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { Modal } from "../../components/ui/modal";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";

const COMMON_TEMPLATES = [
  { label: "Blood Pressure", key: "Blood Pressure", value: "120/80 mmHg" },
  { label: "Heart Rate", key: "Heart Rate", value: "72 bpm" },
  { label: "Body Temperature", key: "Temperature", value: "36.6 °C" },
  { label: "Oxygen Saturation", key: "SpO2", value: "98%" },
  { label: "Blood Glucose", key: "Glucose", value: "5.5 mmol/L" },
  { label: "Hemoglobin", key: "Hb", value: "13.5 g/dL" },
  { label: "Body Weight", key: "Weight", value: "70 kg" },
  { label: "Body Height", key: "Height", value: "175 cm" },
  { label: "Respiratory Rate", key: "Resp Rate", value: "16 bpm" }
];

const RECORD_TYPES = [
  "Lab Result",
  "Imaging Scan",
  "Clinical Note",
  "Prescription",
  "Physical Exam",
  "Surgery Record",
  "Immunization",
  "Emergency Triage"
];

export default function CreateRecordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [recordType, setRecordType] = useState("");
  const [saving, setSaving] = useState(false);

  type KeyValue = { key: string; value: string };
  const [keyValues, setKeyValues] = useState<KeyValue[]>([{ key: "", value: "" }]);

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

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "doctor") {
      router.push("/");
      return;
    }
    queueMicrotask(() => setLoading(false));
  }, [router]);

  const addKeyValue = () => {
    setKeyValues([...keyValues, { key: "", value: "" }]);
  };

  const removeKeyValue = (index: number) => {
    setKeyValues(keyValues.filter((_, i) => i !== index));
  };

  const updateKeyValue = (index: number, field: "key" | "value", value: string) => {
    const updated = [...keyValues];
    updated[index][field] = value;
    setKeyValues(updated);
  };

  const applyTemplateForRow = (index: number, label: string) => {
    const template = COMMON_TEMPLATES.find(t => t.label === label);
    if (template) {
      updateKeyValue(index, "key", template.key);
      updateKeyValue(index, "value", template.value);
    }
  };

  const handleCreateRecord = async () => {
    if (!patientId.trim()) {
      showModal("error", "Missing Patient ID", "Please enter a Patient ID");
      return;
    }
    if (!recordType.trim()) {
      showModal("error", "Missing Record Type", "Please enter a record type");
      return;
    }

    const validKeyValues = keyValues.filter(kv => kv.key.trim() !== "");
    if (validKeyValues.length === 0) {
      showModal("error", "Missing Record Data", "Please add at least one key-value pair");
      return;
    }

    const payloadObj: Record<string, string> = {};
    validKeyValues.forEach(kv => {
      payloadObj[kv.key.trim()] = kv.value.trim();
    });
    const payloadJson = JSON.stringify(payloadObj);

    setSaving(true);
    try {
      const result = await apiFetch("/api/records", {
        method: "POST",
        body: JSON.stringify({ patientId: patientId.trim(), recordType: recordType.trim(), payload: payloadJson }),
      });
      if (result.allowed || result.status === "created") {
        showModal("success", "Record Created", "Medical record has been stored in the blockchain ledger.");
        setPatientId("");
        setRecordType("");
        setKeyValues([{ key: "", value: "" }]);
      } else {
        showModal("error", "Consent Required", "Patient has not granted consent for this transaction.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Record creation failed";
      showModal("error", "Creation Failed", message);
    } finally {
      setSaving(false);
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
            <span className="w-1.5 h-1.5 bg-black rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"></span>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/60">Ledger Entry</p>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none">New Audit Record</h1>
          <p className="mt-1 text-xs text-black/60 font-black italic">Create immutable medical history for authorized patients.</p>
        </div>

        <Card title="Record Composition">
          <div className="grid gap-4 pt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-black/80">Target Patient ID</label>
                <Input
                  placeholder="patient-001"
                  value={patientId}
                  className="h-10 text-xs bg-neutral-50/50 border-none focus:ring-black placeholder:text-black/30"
                  onChange={(event) => setPatientId(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-black/80">Record Classification</label>
                <Select
                  value={recordType}
                  className="h-10 text-xs bg-neutral-50/50 border-none focus:ring-black font-bold uppercase tracking-tight"
                  onChange={(event) => setRecordType(event.target.value)}
                >
                  <option value="">Select Category...</option>
                  {RECORD_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-2">
              <label className="mb-3 block text-[9px] font-black uppercase tracking-widest text-black/80">Record Payload (Integrated Protocol)</label>
              <div className="space-y-3">
                {keyValues.map((kv, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1.5fr_2fr_auto] gap-2 items-end p-4 bg-neutral-50/50 rounded-[2rem] border border-black/[0.03] transition-all hover:bg-white group/row">
                    <div>
                      <label className="mb-1.5 block text-[8px] font-black uppercase tracking-widest text-black/40">Template</label>
                      <Select
                        className="h-9 py-0 px-2 text-[9px] w-full rounded-xl bg-white border-black/5 font-black uppercase tracking-tight shadow-sm"
                        onChange={(e) => {
                          applyTemplateForRow(index, e.target.value);
                          e.target.value = "";
                        }}
                      >
                        <option value="">Quick Select...</option>
                        {COMMON_TEMPLATES.map(t => (
                          <option key={t.label} value={t.label}>{t.label}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[8px] font-black uppercase tracking-widest text-black/40">Audit Key</label>
                      <Input
                        placeholder="e.g. Hb"
                        value={kv.key}
                        className="h-9 text-[10px] bg-white border-black/5 font-bold shadow-sm"
                        onChange={(e) => updateKeyValue(index, "key", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[8px] font-black uppercase tracking-widest text-black/40">Result Value</label>
                      <Input
                        placeholder="e.g. 13.5 g/dL"
                        value={kv.value}
                        className="h-9 text-[10px] bg-white border-black/5 font-bold shadow-sm"
                        onChange={(e) => updateKeyValue(index, "value", e.target.value)}
                      />
                    </div>
                    <div className="pb-1">
                      {keyValues.length > 1 && (
                        <button
                          onClick={() => removeKeyValue(index)}
                          className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={addKeyValue}
                  className="mt-1 py-3 border border-dashed border-black/10 rounded-2xl text-[10px] uppercase font-black tracking-widest text-black/50 hover:bg-neutral-50 hover:text-black transition-all"
                >
                  + Add Data Field
                </button>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-black/[0.03]">
              <Button
                onClick={handleCreateRecord}
                className="w-full h-11 text-[11px] font-black uppercase tracking-widest bg-black text-white hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 flex items-center justify-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Committing to Ledger...
                  </>
                ) : (
                  "Commit Record to Ledger"
                )}
              </Button>
            </div>
          </div>
        </Card>
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
