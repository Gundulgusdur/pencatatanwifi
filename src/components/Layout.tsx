"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getAuthUser } from "@/app/(app)/actions";

const nav = [
  { href: "/", label: "Dashboard", icon: "fa-home" },
  { href: "/customers", label: "Pelanggan", icon: "fa-users" },
  { href: "/billing", label: "Kasir / Tagihan", icon: "fa-file-invoice-dollar" },
  { href: "/reports", label: "Laporan Keuangan", icon: "fa-chart-pie" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      try {
        const u = await getAuthUser();
        setUser(u);
        if (!u) {
          router.push("/auth/login");
        }
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/auth/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <button
        className="pw-mobile-toggle"
        aria-label="Buka menu"
        onClick={() => setSidebarOpen((o) => !o)}
      >
        <i className="fas fa-bars"></i>
      </button>
      {sidebarOpen && (
        <div
          className="fade-overlay"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`pw-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="pw-sidebar-brand d-flex align-items-center justify-content-center">
          <i className="fas fa-wifi me-2"></i>
          <span>PencatatanWiFi</span>
        </div>
        <nav>
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`pw-nav-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <i className={`fas ${item.icon} ${isActive ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="pw-sidebar-footer d-flex flex-column p-3 border-top">
          {user && (
            <>
              <div className="fw-bold text-sm">{user.name}</div>
              <div className="text-muted small">{user.role}</div>
              <button
                onClick={handleLogout}
                className="mt-2 w-auto btn btn-outline-danger btn-sm"
              >
                <i className="fas fa-sign-out-alt me-1"></i> Keluar
              </button>
            </>
          )}
          <div className="fw-bold text-xs mt-2">v1.0 MVP</div>
          <div className="text-muted text-xs">ISP Billing Simple</div>
        </div>
      </aside>
      <main className="pw-main">{children}</main>
    </>
  );
}
