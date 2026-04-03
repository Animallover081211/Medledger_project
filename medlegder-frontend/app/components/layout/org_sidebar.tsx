"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export type OrgSidebarProps = {
  orgName: string;
  portalLabel: string;
  navItems: NavItem[];
  accentColor?: "emerald" | "blue" | "purple" | "orange";
  onLogout?: () => void;
};

const accentStyles = {
  emerald: {
    active: "bg-emerald-600 text-white shadow-lg shadow-emerald-200",
    hover: "hover:bg-emerald-50",
    icon: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  blue: {
    active: "bg-blue-600 text-white shadow-lg shadow-blue-200",
    hover: "hover:bg-blue-50",
    icon: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
  purple: {
    active: "bg-purple-600 text-white shadow-lg shadow-purple-200",
    hover: "hover:bg-purple-50",
    icon: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
  },
  orange: {
    active: "bg-orange-600 text-white shadow-lg shadow-orange-200",
    hover: "hover:bg-orange-50",
    icon: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
  },
};

export function OrgSidebar({
  orgName,
  portalLabel,
  navItems,
  accentColor = "emerald",
  onLogout,
}: OrgSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const styles = accentStyles[accentColor];

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) {
      onLogout();
    } else {
      router.push("/");
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className={`w-8 h-8 ${styles.active} rounded-lg flex items-center justify-center font-bold`}>
              {orgName.charAt(0)}
            </div>
            <span className="text-xl font-bold tracking-tight text-black">MedLedger</span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-neutral-100 text-black hover:bg-neutral-200 transition-colors"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <div className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="px-6 py-8 border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${styles.active} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${styles.badge}`}>
                {orgName.charAt(0)}
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-black block leading-none">MedLedger</span>
                <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${styles.icon} mt-1 block`}>
                  {portalLabel}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-black transition-all ${isActive
                    ? styles.active
                    : `text-black ${styles.hover}`
                  }`}
                >
                  <span className={isActive ? "text-white" : styles.icon}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-black/5">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 flex-col bg-white border-r border-black/5 z-40 transition-all">
        <div className="px-6 py-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className={`w-8 h-8 ${styles.active} rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
              {orgName.charAt(0)}
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-black block leading-none">MedLedger</span>
              <span className={`text-[9px] uppercase tracking-[0.2em] font-black ${styles.icon} mt-1 block`}>
                {portalLabel}
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all duration-200 group ${isActive
                  ? `${styles.active} translate-x-1`
                  : `text-black ${styles.hover} hover:translate-x-0.5`
                }`}
              >
                <span className={isActive ? "text-white" : styles.icon}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-black/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-200 group"
          >
            <div className="text-red-400 group-hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
