"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "../components/layout/shell";
import { Navbar } from "../components/layout/navbar";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { setIdentity, setToken, clearIdentity, type IdentityRole } from "../../lib/identity";

const SPECIALTIES = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Urology",
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<IdentityRole>("patient");
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; message: string; isError: boolean }>({
    show: false,
    message: "",
    isError: false,
  });

  useEffect(() => {
    clearIdentity();
  }, []);

  const handleRegister = async () => {
    if (!userId.trim() || !name.trim()) {
      setStatus("Please fill in all fields");
      return;
    }

    if (role === "doctor" && !specialty) {
      setStatus("Please select a specialty");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId.trim(),
          role,
          name: name.trim(),
          ...(role === "doctor" && specialty ? { specialty: specialty.trim() } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.error?.includes("already exists")) {
          setModal({
            show: true,
            message: `${role === "patient" ? "Patient" : "Doctor"} ID already exists. Please use a different ID.`,
            isError: true,
          });
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Registration failed");
      }

      setToken(data.token);
      setIdentity(data.user);
      
      const roleRoutes: Record<string, string> = {
        patient: "/patient",
        doctor: "/doctor",
        hospital: "/hospital",
        pharmacy: "/pharmacy",
        regulator: "/regulator",
      };
      router.push(roleRoutes[role] || "/");

    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <Navbar />
      <main className="mt-16 grid gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/50">MedLedger</p>
          <h1 className="mt-3 text-3xl font-semibold text-black">Register & Continue</h1>
          <p className="mt-2 text-sm text-black/60">
            Choose your role, enter your ID and name to register on the blockchain.
          </p>
        </div>

        <Card title="Create your identity">
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-black/70">Role</label>
              <Select value={role} onChange={(e) => setRole(e.target.value as IdentityRole)}>
                <option value="patient">Patient</option>
                <option value="doctor">GP Clinic Doctor</option>
                <option value="hospital">Hospital Doctor</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="regulator">Regulator</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-black/70">Your ID</label>
              <Input
                placeholder={
                  role === "patient" ? "e.g. patient-001" :
                  role === "doctor" ? "e.g. gpdoctor-001" :
                  role === "hospital" ? "e.g. hospitaldr-001" :
                  role === "pharmacy" ? "e.g. pharmacy-001" :
                  "e.g. regulator-001"
                }
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="mt-1 text-xs text-black/50">This ID will be used for all interactions</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-black/70">Full Name</label>
              <Input
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {role === "doctor" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-black/70">Specialty</label>
                <Select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  <option value="">Select specialty</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="mt-2">
              <Button onClick={handleRegister} disabled={loading}>
                {loading ? "Registering..." : "Register & Continue"}
              </Button>
            </div>

            {status ? <p className="text-xs text-red-600">{status}</p> : null}

            <p className="mt-4 border-t border-black/10 pt-4 text-xs text-black/50 flex items-center justify-between flex-wrap gap-2">
              <span>
                Already have an identity?{" "}
                <Link href="/login" className="font-black text-black underline">
                  Go to Login
                </Link>
              </span>
              <Link href="/" className="font-semibold text-black/40 underline">
                Home
              </Link>
            </p>
          </div>
        </Card>
      </main>

      {modal.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-red-600">Registration Failed</h3>
            <p className="mt-2 text-sm text-black/70">{modal.message}</p>
            <Button className="mt-4" onClick={() => setModal({ show: false, message: "", isError: false })}>
              OK
            </Button>
          </div>
        </div>
      )}
    </Shell>
  );
}