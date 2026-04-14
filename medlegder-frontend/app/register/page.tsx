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
import { copyToClipboard } from "../../lib/client/clipboard";

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
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [modal, setModal] = useState<{ show: boolean; title: string; message: string; isError: boolean; generatedId?: string; nextRoute?: string }>({
    show: false,
    title: "",
    message: "",
    isError: false,
  });

  useEffect(() => {
    clearIdentity();
  }, []);

  const copyGeneratedId = async () => {
    if (!modal.generatedId) return;
    try {
      const copied = await copyToClipboard(modal.generatedId);
      if (!copied) {
        throw new Error("Clipboard copy failed");
      }
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setStatus("Could not copy the generated ID. Copy it manually from the dialog.");
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setStatus("Please fill in all fields");
      return;
    }

    if (!password.trim() || password.length < 8) {
      setStatus("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match");
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
            role,
            name: name.trim(),
            password,
            ...(role === "doctor" && specialty ? { specialty: specialty.trim() } : {}),
          }),
        });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.error?.includes("already exists")) {
          setModal({
            show: true,
            title: "Registration Failed",
            message: `Could not assign a unique ID automatically. Please try again.`,
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
        hospital: "/doctor",
        pharmacy: "/pharmacy",
        regulator: "/regulator",
      };

      setModal({
        show: true,
        title: "Registration Successful",
        message: `Your new ID is ${data.user.id}. Save it now because you will use it with your password to log in.`,
        isError: false,
        generatedId: data.user.id,
        nextRoute: roleRoutes[role] || "/",
      });

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
            Choose your role, set a password, and we will generate your blockchain ID automatically.
          </p>
        </div>

        <Card title="Create your identity">
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-black/70">Role</label>
              <Select value={role} onChange={(e) => setRole(e.target.value as IdentityRole)}>
                <option value="patient">Patient</option>
                <option value="hospital">Hospital Doctor</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="regulator">Regulator</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-black/70">Full Name</label>
              <Input
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-black/70">Password</label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Choose a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-black/50">Use at least 8 characters.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-black/70">Confirm Password</label>
              <div className="flex gap-2">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={() => setShowConfirmPassword((current) => !current)}>
                  {showConfirmPassword ? "Hide" : "Show"}
                </Button>
              </div>
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
        <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50 px-3 py-3 sm:p-6">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-xl">
            <h3 className={`text-lg font-semibold ${modal.isError ? "text-red-600" : "text-emerald-600"}`}>
              {modal.title}
            </h3>
            <p className="mt-2 text-sm text-black/70 break-words">{modal.message}</p>
            {!modal.isError && modal.generatedId && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-mono text-emerald-700 break-all">
                  {modal.generatedId}
                </span>
                <Button type="button" variant="secondary" size="sm" onClick={copyGeneratedId} className="w-full sm:w-auto">
                  {copyState === "copied" ? "Copied" : "Copy ID"}
                </Button>
              </div>
            )}
            <Button
              className="mt-4 w-full"
              onClick={() => {
                const nextRoute = modal.nextRoute;
                setCopyState("idle");
                setModal({ show: false, title: "", message: "", isError: false });
                if (nextRoute) {
                  router.push(nextRoute);
                }
              }}
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </Shell>
  );
}
