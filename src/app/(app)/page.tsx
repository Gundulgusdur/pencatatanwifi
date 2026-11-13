import { getDashboardStats, getRevenueChart, getRecentActivity, getSystemStatus } from "./actions";
import RevenueChart from "@/components/RevenueChart";

// Render at request time (needs live DB at runtime; skipped during build).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, chart, activity, system] = await Promise.all([
    getDashboardStats(),
    getRevenueChart(),
    getRecentActivity(),
    getSystemStatus(),
  ]);

  const dbBadge = system.database === "online" ? "bg-success" : "bg-danger";
  const dbWidth = system.database === "online" ? 100 : 0;

  return (
    <div className="space-y-3">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Ringkasan kesehatan bisnis internet Anda secara instan.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-4">
          <div className="pw-kpi">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="pw-kpi-label">Pelanggan Aktif</div>
                <div className="pw-kpi-value">
                  {stats.activeCustomers} / {stats.totalCustomers}
                </div>
              </div>
              <div className="pw-kpi-icon primary">
                <i className="fas fa-users"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="pw-kpi">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="pw-kpi-label">Tagihan Tertunda / Jatuh Tempo</div>
                <div className="pw-kpi-value">
                  {stats.unpaidCount} Pelanggan
                </div>
                <div className="pw-kpi-delta neg">
                  Rp {stats.unpaidPotential.toLocaleString("id-ID")} potensial
                </div>
              </div>
              <div className="pw-kpi-icon warning">
                <i className="fas fa-clock"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="pw-kpi">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="pw-kpi-label">Pendapatan Bulan Ini</div>
                <div className="pw-kpi-value">
                  Rp {stats.revenueThisMonth.toLocaleString("id-ID")}
                </div>
                <div className="pw-kpi-delta pos">Bersih, bulan berjalan</div>
              </div>
              <div className="pw-kpi-icon success">
                <i className="fas fa-wallet"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Grafik & Monitoring */}
        <div className="col-lg-8">
          <div className="pw-card">
            <div className="pw-card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-chart-line me-2 text-primary"></i>
                Pendapatan & Pertumbuhan (6 Bulan)
              </h5>
              <div className="text-muted small">
                Grafik tren pendapatan yang telah dibayar
              </div>
            </div>
            <div className="pw-card-body chart-wrap">
              <RevenueChart data={chart} />
            </div>
          </div>
        </div>

        {/* Status Resource Sistem */}
        <div className="col-lg-4">
          <div className="pw-card h-100">
            <div className="pw-card-header">
              <h5 className="mb-0">
                <i className="fas fa-server me-2 text-primary"></i>
                Status Resource Sistem
              </h5>
            </div>
            <div className="pw-card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small">Database</span>
                  <span className={`badge ${dbBadge}`}>
                    {system.database.toUpperCase()}
                  </span>
                </div>
                <div className="progress bg-border" style={{ height: "8px" }}>
                  <div
                    className={`progress-bar ${dbBadge}`}
                    role="progressbar"
                    style={{ width: dbWidth }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small">Aplikasi</span>
                  <span className="badge bg-success">ONLINE</span>
                </div>
                <div className="progress bg-border" style={{ height: "8px" }}>
                  <div className="progress-bar bg-success" role="progressbar" style={{ width: 100 }}></div>
                </div>
              </div>
              <div className="text-muted small mt-3">
                Catatan: pada penyimpanan serverless (Vercel), metrik CPU/RAM/
                Storage router ditampilkan melalui integrasi terpisah (roadmap
                v1.1: RouterOS API).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aktivitas Terbaru */}
      <div className="pw-card">
        <div className="pw-card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-clock me-2 text-primary"></i>
            Aktivitas & Log Pembayaran Terbaru
          </h5>
          <a href="/billing" className="btn btn-sm btn-pw-primary">
            Lihat Semua Tagihan
          </a>
        </div>
        <div className="pw-card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ width: "16%" }}>Waktu</th>
                  <th>Pelanggan / IP</th>
                  <th style={{ width: "18%" }}>Paket</th>
                  <th style={{ width: "16%" }}>Nominal</th>
                  <th style={{ width: "14%" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {activity.length > 0 ? (
                  activity.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="text-muted small">{new Date(a.time).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</div>
                      </td>
                      <td>
                        <div className="fw-medium">{a.customer}</div>
                        <div className="text-muted small">{a.ip}</div>
                      </td>
                      <td>{a.package}</td>
                      <td>
                        Rp {Number(a.amount).toLocaleString("id-ID")}
                      </td>
                      <td>
                        <span
                          className={`badge badge-pill-custom ${
                            a.status === "paid" ? "bg-success text-white" : "bg-warning text-dark"
                          }`}
                        >
                          {a.status === "paid" ? "LUNAS" : "MENUNGGU"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      Belum ada aktivitas. Mulai tambah pelanggan dan catat
                      tagihan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
