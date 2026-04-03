"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar, type NavItem } from "../../components/layout/org_sidebar";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { apiFetch } from "../../../lib/api_client";
import { getIdentity } from "../../../lib/identity";

type UserEntry = {
  id: string;
  role: "patient" | "doctor" | "hospital" | "pharmacy" | "regulator";
  name: string;
};

const regulatorNavItems: NavItem[] = [
  { href: "/regulator", label: "Dashboard", icon: <span>▣</span> },
  { href: "/regulator/users", label: "Users", icon: <span>👥</span> },
  { href: "/regulator/audit", label: "Audit Logs", icon: <span>🧾</span> },
  { href: "/regulator/compliance", label: "Compliance", icon: <span>🛡</span> },
];

const roleLabels: Record<UserEntry["role"], string> = {
  patient: "Patient",
  doctor: "Doctor",
  hospital: "Hospital Doctor",
  pharmacy: "Pharmacy",
  regulator: "Regulator",
};

const roleBadgeStyles: Record<UserEntry["role"], string> = {
  patient: "bg-sky-50 text-sky-700 border-sky-100",
  doctor: "bg-indigo-50 text-indigo-700 border-indigo-100",
  hospital: "bg-violet-50 text-violet-700 border-violet-100",
  pharmacy: "bg-purple-50 text-purple-700 border-purple-100",
  regulator: "bg-orange-50 text-orange-700 border-orange-100",
};

export default function RegulatorUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = normalizedSearch
    ? users.filter((user) => {
        const roleLabel = roleLabels[user.role].toLowerCase();
        return (
          user.name.toLowerCase().includes(normalizedSearch) ||
          user.id.toLowerCase().includes(normalizedSearch) ||
          user.role.toLowerCase().includes(normalizedSearch) ||
          roleLabel.includes(normalizedSearch)
        );
      })
    : users;

  useEffect(() => {
    const identity = getIdentity();
    if (!identity || identity.role !== "regulator") {
      router.push("/");
      return;
    }

    const load = async () => {
      try {
        const result = await apiFetch("/api/regulator/users");
        setUsers(Array.isArray(result?.users) ? result.users : []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <OrgSidebar orgName="Regulator" portalLabel="Regulator Portal" navItems={regulatorNavItems} accentColor="orange" />
      <div className="lg:ml-56 min-h-screen bg-neutral-50 p-6 pt-24 lg:pt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-slate-900">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,88,6,0.3)]" />
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-orange-600">Regulator Portal</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight leading-none">All Users</h1>
            <p className="mt-3 text-sm sm:text-base text-black/60 font-medium max-w-2xl">
              View every registered identity across all roles, including patients, doctors, hospital staff, pharmacy, and regulator accounts.
            </p>
          </div>

          <Card title="User Directory">
            <div className="grid gap-4 pt-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-black/40">Search</p>
                  <p className="text-xs text-black/50">Filter by name, user ID, or role</p>
                </div>
                <div className="w-full sm:max-w-md">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search users..."
                    className="h-11 bg-white border-orange-100 focus:ring-orange-500 placeholder:text-black/30"
                  />
                </div>
              </div>

              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div key={user.id} className="group flex flex-col gap-4 p-5 sm:p-6 bg-white rounded-[1.75rem] border border-black/[0.04] shadow-sm hover:shadow-lg hover:shadow-orange-100/40 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center font-black text-orange-700 text-lg uppercase shadow-inner">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-[0.28em] text-black/40 font-bold">Name</p>
                          <p className="text-lg sm:text-xl font-black text-black leading-tight truncate">{user.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 font-bold mt-1">Identity Record</p>
                        </div>
                      </div>
                      <div className={`shrink-0 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${roleBadgeStyles[user.role]}`}>
                        {roleLabels[user.role]}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-black/[0.04] bg-black/[0.02] px-4 py-3">
                        <p className="text-[9px] uppercase tracking-[0.28em] text-black/40 font-bold">User ID</p>
                        <p className="mt-1 text-sm sm:text-base font-mono font-bold text-black break-all">{user.id}</p>
                      </div>
                      <div className="rounded-2xl border border-black/[0.04] bg-black/[0.02] px-4 py-3">
                        <p className="text-[9px] uppercase tracking-[0.28em] text-black/40 font-bold">Role</p>
                        <p className="mt-1 text-sm sm:text-base font-bold text-black">{roleLabels[user.role]}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-orange-200 bg-orange-50/40 p-10 text-center">
                  <p className="text-base font-black text-black">{search.trim() ? "No matching users" : "No users found"}</p>
                  <p className="mt-1 text-sm text-black/50">
                    {search.trim()
                      ? "Try a different name, ID, or role."
                      : "Registered identities will appear here once they are created."}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
