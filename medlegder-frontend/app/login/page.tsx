"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { setIdentity, setToken, type IdentityRole } from "../../lib/identity";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<IdentityRole>("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!userId.trim()) {
      setError("Please enter your ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId.trim(),
          role,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ID not found. Please register first.");
        setLoading(false);
        return;
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
      router.push(roleRoutes[role] || "/");
    } catch {
      setError("Connection error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-black tracking-tight">MedLedger</h1>
          <p className="mt-2 text-black/80 font-bold">Secure Healthcare Identity</p>
        </div>

        <Card title="Login">
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-black text-black uppercase tracking-widest">Role Identification</label>
              <Select value={role} onChange={(e) => setRole(e.target.value as IdentityRole)}>
                <option value="patient">Patient</option>
                <option value="hospital">Hospital Doctor</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="regulator">Regulator</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-black uppercase tracking-widest">Your ID</label>
              <Input
                placeholder="patient-001 or doctor-001"
                value={userId}
                className="placeholder:text-black/30"
                onChange={(e) => {
                  setUserId(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-black uppercase tracking-widest">Password</label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  className="placeholder:text-black/30"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <Button type="button" variant="secondary" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button onClick={handleLogin} disabled={loading}>
              {loading ? "Verifying..." : "Login"}
            </Button>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-black/60">
          New user?{" "}
          <a href="/register" className="text-black font-medium underline">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
