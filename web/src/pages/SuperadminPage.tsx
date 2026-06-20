import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Users, Calendar, Ticket, Mail, ShoppingCart, Webhook } from "lucide-react";
import { api } from "../lib/api";
import Layout from "../components/Layout";

const s: Record<string, React.CSSProperties> = {
  title: { fontSize: 22, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 },
  subtitle: { color: "#555", fontSize: 13, marginBottom: 28 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 32 },
  statCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "18px 20px" },
  statNum: { fontSize: 32, fontWeight: 800, color: "#f0f0f0", lineHeight: 1 },
  statLabel: { fontSize: 12, color: "#555", marginTop: 6, display: "flex", alignItems: "center", gap: 5 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "#ccc", marginBottom: 12 },
  table: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, overflow: "hidden", marginBottom: 32 },
  th: { padding: "9px 14px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "#555", background: "#111", borderBottom: "1px solid #222", letterSpacing: 1, textTransform: "uppercase" as const },
  td: { padding: "11px 14px", borderBottom: "1px solid #1f1f1f", fontSize: 13, color: "#ccc" },
  actionBtn: { background: "none", border: "1px solid #2a2a2a", color: "#888", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11 },
};

function roleBadge(role: string): React.CSSProperties {
  return {
    display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
    background: role === "superadmin" ? "#2d1b69" : "#1a1a1a",
    color: role === "superadmin" ? "#a78bfa" : "#555",
    border: `1px solid ${role === "superadmin" ? "#4c1d95" : "#2a2a2a"}`,
  };
}

const _s: Record<string, React.CSSProperties> = {
  confirmRow: { display: "flex", gap: 20 },
  confirmItem: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "14px 18px", flex: 1 },
  confirmNum: { fontSize: 24, fontWeight: 700, color: "#f0f0f0" },
  confirmLabel: { fontSize: 12, color: "#ccc", marginTop: 6, lineHeight: 1.5 },
};

function StatCard({ value, label, icon, color }: { value: number | string; label: string; icon: React.ReactNode; color?: string }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statNum, color: color ?? "#f0f0f0" }}>{value}</div>
      <div style={s.statLabel}>{icon} {label}</div>
    </div>
  );
}

export default function SuperadminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await api.getSuperadminStats();
      setStats(data);
    } catch (err: any) {
      toast.error(err.message ?? "Error cargando stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function promote(id: string) {
    try {
      await api.promoteUser(id);
      toast.success("Usuario promovido a superadmin");
      load();
    } catch { toast.error("Error"); }
  }

  async function demote(id: string) {
    try {
      await api.demoteUser(id);
      toast.success("Rol removido");
      load();
    } catch { toast.error("Error"); }
  }

  if (loading) return <Layout><div style={{ padding: 60, color: "#444", textAlign: "center" }}>Cargando...</div></Layout>;

  return (
    <Layout>
      <div style={s.title}>Superadmin</div>
      <div style={s.subtitle}>Panel de administración global del sistema</div>

      {/* Stats grid */}
      <div style={s.grid}>
        <StatCard value={stats.totalUsers} label="Usuarios registrados" icon={<Users size={11} />} />
        <StatCard value={stats.totalEvents} label="Eventos creados" icon={<Calendar size={11} />} />
        <StatCard value={stats.totalInvitations} label="Entradas totales" icon={<Ticket size={11} />} />
        <StatCard value={stats.totalManual} label="Entradas manuales" icon={<Ticket size={11} />} color="#888" />
        <StatCard value={stats.totalPurchase} label="Entradas compradas" icon={<ShoppingCart size={11} />} color="#009ee3" />
        <StatCard value={stats.totalEntered} label="Ingresos validados" icon={<Ticket size={11} />} color="#4ade80" />
        <StatCard value={stats.emailsSent} label="Emails enviados" icon={<Mail size={11} />} color="#7c3aed" />
      </div>

      {/* Confirmaciones MP */}
      <div style={s.sectionTitle}>Confirmaciones MercadoPago</div>
      <div style={{ ...s.confirmRow, marginBottom: 32, flexWrap: "wrap" as const, gap: 12 }}>
        <div style={s.confirmItem}>
          <div style={s.confirmNum}>{stats.purchaseConfirmations.webhook}</div>
          <div style={s.confirmLabel}><Webhook size={10} style={{ display: "inline", marginRight: 4 }} />Via webhook (MP notificó al backend)</div>
        </div>
        <div style={s.confirmItem}>
          <div style={s.confirmNum}>{stats.purchaseConfirmations.redirect}</div>
          <div style={{ ...s.confirmLabel }}>Via redirect (confirmado desde la URL de retorno)</div>
        </div>
        <div style={s.confirmItem}>
          <div style={{ ...s.confirmNum, color: "#facc15" }}>{stats.purchaseConfirmations.pending}</div>
          <div style={s.confirmLabel}>Pago pendiente (no confirmado aún)</div>
        </div>
      </div>

      {/* Usuarios recientes */}
      <div style={s.sectionTitle}>Usuarios ({stats.recentUsers.length} más recientes)</div>
      <div style={s.table}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={s.th}>Usuario</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Eventos</th>
              <th style={s.th}>Rol</th>
              <th style={s.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentUsers.map((u: any) => (
              <tr key={u.id}>
                <td style={s.td}><strong style={{ color: "#e0e0e0" }}>{u.name}</strong><div style={{ color: "#555", fontSize: 11 }}>@{u.username}</div></td>
                <td style={{ ...s.td, color: "#666", fontSize: 12 }}>{u.email}</td>
                <td style={{ ...s.td, textAlign: "center" as const }}>{u._count.events}</td>
                <td style={s.td}><span style={roleBadge(u.role)}>{u.role}</span></td>
                <td style={s.td}>
                  {u.role !== "superadmin"
                    ? <button style={s.actionBtn} onClick={() => promote(u.id)}>Promover</button>
                    : <button style={s.actionBtn} onClick={() => demote(u.id)}>Revocar</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
