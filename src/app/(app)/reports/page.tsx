"use client";

import { useState, useEffect } from "react";

// Rendered at request time (needs live DB at runtime; skipped during build).
export const dynamic = "force-dynamic";
import {
  listInvoices,
  getKolektibilitas,
  listPeriods,
  type InvoiceRow,
} from "../actions";

export default function ReportsPage() {
  const [periods, setPeriods] = useState<string[]>([]);
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState("all"); // all | paid | unpaid
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [kolo, setKolo] = useState<{
    period: string;
    totalCount: number;
    paidCount: number;
    totalAmount: number;
    paidAmount: number;
    ratio: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listPeriods().then(setPeriods);
  }, []);

  useEffect(() => {
    if (!period && periods.length) setPeriod(periods[0]);
  }, [periods]);

  const load = async () => {
    if (!period) return;
    setLoading(true);
    try {
      const [data, k] = await Promise.all([
        listInvoices({ period, status: status === "all" ? undefined : status }),
        getKolektibilitas(period),
      ]);
      setInvoices(data);
      setKolo(k);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period, status]);

  const fmt = (v: number) => Number(v).toLocaleString("id-ID");

  const exportCSV = () => {
    const headers = ["Tanggal", "Pelanggan", "Periode", "Nominal", "Status"];
    const rows = invoices.map((inv) => [
      inv.paidAt ? new Date(inv.paidAt).toLocaleString("id-ID") : "-",
      inv.customerName,
      inv.billingPeriod,
      inv.amount,
      inv.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    window.print();
  };

  const statusColor = (s: string) =>
    s === "paid" ? "bg-success text-white" : "bg-warning text-dark";

  return (
    <div className="space-y-3">
      <div>
        <h1 className="page-title">Laporan Keuangan Bulanan</h1>
        <p className="page-subtitle">
          Performa bisnis secara historis dengan rasio kolektibilitas.
        </p>
      </div>

      <div className="pw-card mb-4">
        <div className="pw-card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label fw-medium small">Bulan / Tahun</label>
              <select
                className="form-select form-select-sm"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {periods.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-medium small">Status</label>
              <select
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">Semua</option>
                <option value="paid">Lunas</option>
                <option value="unpaid">Belum Bayar</option>
              </select>
            </div>
            <div className="col-md-3 d-grid">
              <button className="btn btn-outline-primary" onClick={exportCSV} disabled={loading}>
                <i className="fas fa-file-csv me-2"></i>Ekspor CSV
              </button>
            </div>
            <div className="col-md-3 d-grid">
              <button className="btn btn-outline-secondary" onClick={printPDF}>
                <i className="fas fa-file-pdf me-2"></i>Cetak PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Kolektibilitas */}
      {kolo && (
        <div className="pw-kpi mb-4" style={{ display: "inline-block", width: "auto", maxWidth: "340px" }}>
          <div className="pw-kpi-label">Rasio Kolektibilitas — {kolo.period}</div>
          <div className="pw-kpi-value" style={{ fontSize: "1.75rem" }}>
            {kolo.ratio}%
          </div>
          <div className="pw-kpi-delta">
            {kolo.paidCount} / {kolo.totalCount} tagihan lunas ·
            Rp {fmt(kolo.paidAmount)} / Rp {fmt(kolo.totalAmount)}
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="pw-card">
        <div className="pw-card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-table me-2 text-primary"></i>
            Rekapitulasi Tagihan
          </h5>
          <span className="badge bg-secondary">{invoices.length} data</span>
        </div>
        <div className="pw-card-body p-0" style={{ maxHeight: "420px", overflow: "auto" }}>
          {loading ? (
            <div className="text-center text-muted py-4">Memuat...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center text-muted py-4">Tidak ada data untuk filter ini.</div>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Tanggal Bayar</th>
                  <th>Pelanggan</th>
                  <th style={{ width: "16%" }}>Periode</th>
                  <th style={{ width: "18%" }}>Nominal</th>
                  <th style={{ width: "14%" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="text-muted small">
                      {inv.paidAt ? new Date(inv.paidAt).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="fw-medium">{inv.customerName}</td>
                    <td>{inv.billingPeriod}</td>
                    <td>Rp {fmt(inv.amount)}</td>
                    <td>
                      <span className={`badge badge-pill-custom ${statusColor(inv.status)}`}>
                        {inv.status === "paid" ? "LUNAS" : "BELUM BAYAR"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print, .pw-card-header .btn, .btn { display: none !important; }
          body { background: #fff; }
          .pw-card { box-shadow: none; border: 1px solid #ddd; }
        }
      `}</style>
    </div>
  );
}
