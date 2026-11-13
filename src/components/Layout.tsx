"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: "fa-home" },
  { href: "/customers", label: "Pelanggan", icon: "fa-users" },
  { href: "/billing", label: "Kasir / Tagihan", icon: "fa-file-invoice-dollar" },
  { href: "/reports", label: "Laporan Keuangan", icon: "fa-chart-pie" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
        <div className="pw-sidebar-footer d-flex flex-column">
          <div className="fw-bold">v1.0 MVP</div>
          <div>ISP Billing Simple</div>
        </div>
      </aside>
      <main className="pw-main">{children}</main>
    </>
  );
}
