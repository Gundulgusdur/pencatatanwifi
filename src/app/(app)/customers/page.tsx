"use client";

import { useState, useEffect, useCallback } from "react";

// Rendered at request time (needs live DB at runtime; skipped during build).
export const dynamic = "force-dynamic";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listPackages,
} from "../actions";
import type { CustomerRow } from "../actions";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [packages, setPackages] = useState<{ id: number; packageName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    ipAddress: "",
    packageId: "",
    dueDateDay: "",
    status: "active",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [custs, pkgs] = await Promise.all([listCustomers(), listPackages()]);
      setCustomers(custs);
      setPackages(pkgs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "create") {
        await createCustomer({
          name: form.name,
          whatsapp: form.whatsapp,
          ipAddress: form.ipAddress || undefined,
          packageId: Number(form.packageId),
          dueDateDay: Number(form.dueDateDay),
          status: form.status,
        });
      } else {
        await updateCustomer(editingId!, {
          name: form.name,
          whatsapp: form.whatsapp,
          ipAddress: form.ipAddress || undefined,
          packageId: Number(form.packageId),
          dueDateDay: Number(form.dueDateDay),
          status: form.status,
        });
      }
      setOpen(false);
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c: CustomerRow) => {
    setMode("edit");
    setEditingId(c.id);
    setForm({
      name: c.name,
      whatsapp: c.whatsapp,
      ipAddress: c.ipAddress ?? "",
      packageId: String(c.packageName ? 0 : ""), // packageName shown; packageId not in row — simplify
      dueDateDay: String(c.dueDateDay),
      status: c.status,
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus pelanggan ini?")) return;
    await deleteCustomer(id);
    await load();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-success text-white";
      case "isolated": return "bg-warning text-dark";
      default: return "bg-secondary";
    }
  };

  if (loading) return <div className="text-muted text-center py-5">Memuat...</div>;

  return (
    <div className="space-y-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="page-title">Manajemen Pelanggan</h1>
          <p className="page-subtitle">
            Formulir maksimal 5 kolom, muncul sebagai modal tanpa pindah halaman.
          </p>
        </div>
        <button
          className="btn btn-pw-primary"
          onClick={() => {
            setMode("create");
            setEditingId(null);
            setForm({ name: "", whatsapp: "", ipAddress: "", packageId: "", dueDateDay: "", status: "active" });
            setOpen(true);
          }}
        >
          <i className="fas fa-plus me-2"></i>Tambah Pelanggan
        </button>
      </div>

      <div className="pw-card">
        <div className="pw-card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>WhatsApp</th>
                  <th>Paket</th>
                  <th>IP / Lokasi</th>
                  <th className="text-center" style={{ width: "10%" }}>JTH Tempo</th>
                  <th className="text-center" style={{ width: "12%" }}>Status</th>
                  <th className="text-center" style={{ width: "16%" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="fw-medium">{c.name}</td>
                    <td>
                      <a href={`https://wa.me/${c.whatsapp}`} className="text-decoration-none">
                        {c.whatsapp}
                      </a>
                    </td>
                    <td>{c.packageName ?? "-"}</td>
                    <td className="text-muted small">{c.ipAddress ?? "-"}</td>
                    <td className="text-center">{c.dueDateDay}</td>
                    <td className="text-center">
                      <span className={`badge badge-pill-custom ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleEdit(c)}
                      >
                        <i className="fas fa-pen"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(c.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`modal fade ${open ? "show d-block" : "d-none"}`}
        style={{ display: open ? "block" : "none" }}
        tabIndex={-1}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="pw-modal-content">
            <div className="pw-modal-header">
              <h5 className="modal-title">
                {mode === "create" ? "Tambah Pelanggan" : "Edit Pelanggan"}
              </h5>
              <button
                className="btn-close"
                onClick={() => setOpen(false)}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="pw-modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-medium">Nama Lengkap Pelanggan</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Nomor WhatsApp</label>
                    <input
                      className="form-control"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="628123456789"
                      required
                    />
                    <div className="form-text">Otomatis diformat ke 628xxx untuk kirim struk.</div>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Pilihan Paket & Harga</label>
                    <select
                      className="form-select"
                      value={form.packageId}
                      onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih Paket --</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.packageName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">IP Address / ID PPPoE / Lokasi</label>
                    <input
                      className="form-control"
                      value={form.ipAddress}
                      onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                      placeholder="Opsional"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Tanggal Jatuh Tempo (1-28)</label>
                    <input
                      className="form-control"
                      type="number"
                      min="1"
                      max="28"
                      value={form.dueDateDay}
                      onChange={(e) => setForm({ ...form, dueDateDay: e.target.value })}
                      defaultValue={new Date().getDate()}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="pw-modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-pw-primary" disabled={loading}>
                  {mode === "create" ? "Simpan Pelanggan" : "Perbarui"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="modal-backdrop fade show" style={{ display: open ? "block" : "none" }}></div>
      </div>
    </div>
  );
}
