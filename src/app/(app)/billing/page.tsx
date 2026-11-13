"use client";

/**
 * Halaman Kasir / Pencatatan Tagihan
 * ----------------------------------
 * Alur:
 * 1. Saat dibuka → ambil daftar periode tagihan, pilih periode terbaru.
 * 2. Saat periode berubah → muat tagihan belum bayar periode tersebut.
 * 3. Ketik di kotak cari → filter tagihan berdasarkan nama / WhatsApp / periode.
 * 4. Klik "Bayar Lunas" → server action menandai lunas + membuat link struk WA.
 * 5. Link struk muncul di modal → klik "Buka WhatsApp".
 * 6. "Generate Tagihan Bulanan" → buat tagihan untuk semua pelanggan aktif.
 */
import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/Modal";
import {
  getUnpaidInvoicesForPeriod,
  payInvoice,
  generateInvoicesForPeriod,
  listPeriods,
  type InvoiceRow,
} from "../actions";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatRupiah(value: number) {
  return Number(value).toLocaleString("id-ID");
}

export default function BillingPage() {
  const [periods, setPeriods] = useState<string[]>([]);
  const [period, setPeriod] = useState("");
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<{ url: string; name: string } | null>(null);

  // Muat tagihan belum bayar untuk periode aktif.
  const loadInvoices = useCallback(async (targetPeriod: string) => {
    if (!targetPeriod) return;
    setLoading(true);
    try {
      const data = await getUnpaidInvoicesForPeriod(targetPeriod);
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Saat pertama kali dibuka: ambil daftar periode lalu pilih yang terbaru.
  useEffect(() => {
    (async () => {
      const list = await listPeriods();
      setPeriods(list);
      const initial = list[0] ?? currentPeriod();
      setPeriod(initial);
    })();
  }, []);

  // Setiap periode berubah → muat ulang tagihan.
  useEffect(() => {
    loadInvoices(period);
  }, [period, loadInvoices]);

  // Filter di sisi client (instan saat mengetik).
  const visibleInvoices = invoices.filter((inv) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inv.customerName.toLowerCase().includes(q) ||
      (inv.customerWhatsapp ?? "").includes(q) ||
      inv.billingPeriod.includes(q)
    );
  });

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateInvoicesForPeriod(period || currentPeriod());
      alert(`Terbuat ${result.created} tagihan baru untuk periode ${result.period}.`);
      await loadInvoices(period || currentPeriod());
    } finally {
      setGenerating(false);
    }
  }

  async function handlePay(id: number, name: string) {
    setPayingId(id);
    try {
      const { waUrl } = await payInvoice(id);
      await loadInvoices(period);
      setReceipt({ url: waUrl, name });
    } catch (err) {
      console.error("Gagal memproses pembayaran:", err);
      alert("Gagal memproses pembayaran.");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="page-title">Kasir / Pencatatan Tagihan</h1>
          <p className="page-subtitle mb-0">
            Cari pelanggan, lalu klik [Bayar Lunas].
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: "150px" }}
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
            disabled={generating}
          >
            {generating ? "Memproses..." : "Generate Tagihan Bulanan"}
          </button>
        </div>
      </div>

      {/* Kotak pencarian */}
      <div className="pw-card mb-3">
        <div className="pw-card-body py-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              className="form-control"
              placeholder="Cari nama pelanggan, WhatsApp, atau IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Daftar tagihan */}
      <div className="pw-card">
        <div className="pw-card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-file-invoice-dollar me-2 text-primary"></i>
            Tagihan Belum Bayar — {period || "-"}
          </h5>
          <span className="badge bg-secondary">{visibleInvoices.length} tagihan</span>
        </div>

        <div className="pw-card-body p-0">
          {loading ? (
            <div className="text-center text-muted py-4">Memuat...</div>
          ) : visibleInvoices.length === 0 ? (
            <div className="text-center text-muted py-4">
              Tidak ada tagihan belum bayar untuk periode ini.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th>WhatsApp</th>
                    <th>Periode</th>
                    <th>Nominal</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="fw-medium">{inv.customerName}</td>
                      <td className="text-muted small">{inv.customerWhatsapp ?? "-"}</td>
                      <td>{inv.billingPeriod}</td>
                      <td>Rp {formatRupiah(inv.amount)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-pw-primary btn-sm"
                          onClick={() => handlePay(inv.id, inv.customerName)}
                          disabled={payingId === inv.id}
                        >
                          {payingId === inv.id ? "Proses..." : "Bayar Lunas"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal struk WhatsApp */}
      <Modal
        open={receipt !== null}
        title="Kirim Struk via WhatsApp"
        onClose={() => setReceipt(null)}
        footer={
          <>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setReceipt(null)}
            >
              Tutup
            </button>
            {receipt && (
              <a
                href={receipt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-pw-primary"
              >
                <i className="fab fa-whatsapp me-2"></i>Buka WhatsApp
              </a>
            )}
          </>
        }
      >
        {receipt && (
          <p className="mb-0">
            Struk pembayaran untuk <strong>{receipt.name}</strong> siap dikirim.
          </p>
        )}
      </Modal>
    </div>
  );
}
