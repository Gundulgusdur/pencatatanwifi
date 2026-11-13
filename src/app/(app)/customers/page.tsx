"use client";

/**
 * Halaman Manajemen Pelanggan
 * ---------------------------
 * Alur data:
 * 1. Saat halaman dibuka → `load()` mengambil daftar pelanggan + paket.
 * 2. Tombol "Tambah" → buka modal dengan form kosong.
 * 3. Tombol "Edit"  → buka modal dengan form terisi data pelanggan.
 * 4. Submit form    → `handleSubmit()` memanggil server action, lalu reload.
 * 5. Tombol "Hapus" → konfirmasi, panggil server action, lalu reload.
 */
import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/Modal";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listPackages,
} from "../actions";
import type { CustomerRow } from "../actions";

type PackageOption = { id: number; packageName: string };

type FormState = {
  name: string;
  whatsapp: string;
  ipAddress: string;
  packageId: string;
  dueDateDay: string;
  status: string;
};

function emptyForm(): FormState {
  return {
    name: "",
    whatsapp: "",
    ipAddress: "",
    packageId: "",
    dueDateDay: String(new Date().getDate()),
    status: "active",
  };
}

export default function CustomersPage() {
  // Data
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);

  // State modal & form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const isEditing = editingId !== null;

  // Ambil data pelanggan + paket dari server.
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

  // Buka modal untuk pelanggan baru.
  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  // Buka modal untuk mengedit pelanggan yang dipilih.
  function openEditModal(customer: CustomerRow) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      whatsapp: customer.whatsapp,
      ipAddress: customer.ipAddress ?? "",
      packageId: String(customer.packageId),
      dueDateDay: String(customer.dueDateDay),
      status: customer.status,
    });
    setModalOpen(true);
  }

  // Simpan data (buat baru atau perbarui).
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        whatsapp: form.whatsapp,
        ipAddress: form.ipAddress || null,
        packageId: Number(form.packageId),
        dueDateDay: Number(form.dueDateDay),
        status: form.status,
      };

      if (isEditing) {
        await updateCustomer(editingId!, payload);
      } else {
        await createCustomer(payload);
      }

      setModalOpen(false);
      await load();
    } catch (err) {
      console.error("Gagal menyimpan pelanggan:", err);
      alert("Gagal menyimpan pelanggan. Periksa koneksi/database.");
    } finally {
      setSaving(false);
    }
  }

  // Hapus pelanggan setelah konfirmasi.
  async function handleDelete(id: number) {
    if (!window.confirm("Hapus pelanggan ini?")) return;
    try {
      await deleteCustomer(id);
      await load();
    } catch (err) {
      console.error("Gagal menghapus pelanggan:", err);
      alert("Gagal menghapus pelanggan.");
    }
  }

  return (
    <div>
      {/* Header halaman */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="page-title">Manajemen Pelanggan</h1>
          <p className="page-subtitle mb-0">
            Tambah atau edit pelanggan lewat modal tanpa pindah halaman.
          </p>
        </div>
        <button className="btn btn-pw-primary" onClick={openCreateModal}>
          <i className="fas fa-plus me-2"></i>Tambah Pelanggan
        </button>
      </div>

      {/* Tabel pelanggan */}
      <div className="pw-card">
        <div className="pw-card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>WhatsApp</th>
                  <th>Paket</th>
                  <th>IP / Lokasi</th>
                  <th className="text-center">Jatuh Tempo</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      Memuat data...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      Belum ada pelanggan. Klik "Tambah Pelanggan".
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-medium">{c.name}</td>
                      <td>
                        <a
                          href={`https://wa.me/${c.whatsapp}`}
                          className="text-decoration-none"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {c.whatsapp}
                        </a>
                      </td>
                      <td>{c.packageName ?? "-"}</td>
                      <td className="text-muted small">{c.ipAddress ?? "-"}</td>
                      <td className="text-center">{c.dueDateDay}</td>
                      <td className="text-center">
                        <span className={`badge badge-pill-custom ${statusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => openEditModal(c)}
                          title="Edit"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(c.id)}
                          title="Hapus"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal tambah/edit pelanggan */}
      <Modal
        open={modalOpen}
        title={isEditing ? "Edit Pelanggan" : "Tambah Pelanggan"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              form="customer-form"
              className="btn btn-pw-primary"
              disabled={saving}
            >
              {saving ? "Menyimpan..." : isEditing ? "Perbarui" : "Simpan Pelanggan"}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit}>
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
              <div className="form-text">
                Otomatis diformat ke 628xxx untuk kirim struk.
              </div>
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
              <label className="form-label fw-medium">
                IP Address / ID PPPoE / Lokasi
              </label>
              <input
                className="form-control"
                value={form.ipAddress}
                onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                placeholder="Opsional"
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-medium">
                Tanggal Jatuh Tempo (1-28)
              </label>
              <input
                className="form-control"
                type="number"
                min="1"
                max="28"
                value={form.dueDateDay}
                onChange={(e) => setForm({ ...form, dueDateDay: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/** Warna badge sesuai status pelanggan. */
function statusBadge(status: string) {
  if (status === "active") return "bg-success text-white";
  if (status === "isolated") return "bg-warning text-dark";
  return "bg-secondary text-white";
}
