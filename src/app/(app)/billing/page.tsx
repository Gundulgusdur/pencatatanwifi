"use client";

import { useState, useEffect, useCallback } from "react";

// Rendered at request time (needs live DB at runtime; skipped during build).
export const dynamic = "force-dynamic";
import {
  getUnpaidInvoicesForPeriod,
  payInvoice,
  generateInvoicesForPeriod,
  listPeriods,
  type InvoiceRow,
} from "../actions";

export default function BillingPage() {
  const [period, setPeriod] = useState<string>("");
  const [periods, setPeriods] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<Set<number>>(new Set());
  const [wa, setWa] = useState<{ url: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const p = period || new Date().toISOString().slice(0, 7).replace(/^(\d{4})-(\d{2}).*$/, "$1-$2");
    setLoading(true);
    try {
      const data = await getUnpaidInvoicesForPeriod(p);
      setInvoices(data.filter((inv) => matchesSearch(inv, search)));
    } finally {
      setLoading(false);
    }
  }, [period, search]);

  useEffect(() => {
    listPeriods().then(setPeriods);
  }, []);

  useEffect(() => {
    if (!period && periods.length) setPeriod(periods[0]);
    else load();
  }, [period, periods, load]);

  const matchesSearch = (inv: InvoiceRow, q: string) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      inv.customerName.toLowerCase().includes(s) ||
      (inv.customerWhatsapp && inv.customerWhatsapp.includes(s)) ||
      inv.billingPeriod.includes(s)
    );
  };

  const handleGenerate = async () => {
    const p = period || new Date().toISOString().slice(0, 7).replace(/^(\d{4})-(\d{2}).*$/, "$1-$2");
    setLoading(true);
    try {
      const res = await generateInvoicesForPeriod(p);
      window.alert(`Terbuat ${res.created} tagihan baru untuk periode ${res.period}.`);
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id: number, name: string, whatsapp: string | null) => {
    setPaying((prev) => new Set([...prev, id]));
    try {
      const { waUrl } = await payInvoice(id);
      await load();
      setWa({ url: waUrl, name });
    } finally {
      setPaying((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  };

  const fmt = (v: number) => Number(v).toLocaleString("id-ID");

  return (
    <div className="space-y-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h1 className="page-title">Kasir / Pencatatan Tagihan</h1>
          <p className="page-subtitle">
            Cari pelanggan, ketik ≥3 huruf nama atau IP, lalu [Bayar Lunas].
          </p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: "160px" }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Generate Tagihan Bulanan"}
          </button>
        </div>
      </div>

      {/* Live search */}
      <div className="pw-card mb-3">
        <div className="pw-card-body py-3">
          <div className="input-group">
            <span className="input-group-text"><i className="fas fa-search"></i></span>
            <input
              className="form-control"
              placeholder="Cari nama pelanggan atau IP (min. 3 huruf)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="input-group-text text-muted small">≥3 karakter</span>
          </div>
        </div>
      </div>

      {/* Invoice list */}
      <div className="pw-card">
        <div className="pw-card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-file-invoice-dollar me-2 text-primary"></i>
            Tagihan Belum Bayar — Periode {period || "-"}
          </h5>
          <span className="badge bg-secondary">{invoices.length} tagihan</span>
        </div>
        <div className="pw-card-body p-0">
          {loading ? (
            <div className="text-center text-muted py-4">Memuat...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center text-muted py-4">
              Belum ada tagihan belum bayar untuk periode ini.
            </div>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: "26%" }}>Pelanggan</th>
                  <th style={{ width: "18%" }}>WhatsApp</th>
                  <th style={{ width: "16%" }}>Periode</th>
                  <th style={{ width: "16%" }}>Nominal</th>
                  <th className="text-center" style={{ width: "24%" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="fw-medium">{inv.customerName}</td>
                    <td>
                      <a href={`https://wa.me/${inv.customerWhatsapp}`} className="text-decoration-none text-muted small">
                        {inv.customerWhatsapp ?? "-"}
                      </a>
                    </td>
                    <td>{inv.billingPeriod}</td>
                    <td>Rp {fmt(inv.amount)}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-pw-primary btn-sm"
                        onClick={() => handlePay(inv.id, inv.customerName, inv.customerWhatsapp)}
                        disabled={paying.has(inv.id)}
                      >
                        {paying.has(inv.id) ? "Proses..." : "Bayar Lunas"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* WhatsApp struk popup */}
      {wa && (
        <div className="modal fade show d-block" style={{ display: "block" }} tabIndex={-1}>
          <div className="modal-backdrop fade show"></div>
          <div className="modal-dialog modal-dialog-centered">
            <div className="pw-modal-content">
              <div className="pw-modal-header">
                <h5 className="modal-title">Kirim Struk via WhatsApp</h5>
                <button className="btn-close" onClick={() => setWa(null)}></button>
              </div>
              <div className="pw-modal-body">
                Struk pembayaran untuk <strong>{wa.name}</strong> siap dikirim.
              </div>
              <div className="pw-modal-footer">
                <a href={wa.url} target="_blank" rel="noopener noreferrer" className="btn btn-pw-primary">
                  <i className="fab fa-whatsapp me-2"></i>Buka WhatsApp
                </a>
                <button className="btn btn-outline-secondary" onClick={() => setWa(null)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
