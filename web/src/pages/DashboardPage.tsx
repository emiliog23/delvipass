import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, CalendarDays, MapPin, Users, Trash2 } from "lucide-react";
import { api, Event } from "../lib/api";
import Layout from "../components/Layout";

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, color: "#f0f0f0" },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#7c3aed",
    color: "white",
    textDecoration: "none",
    padding: "9px 18px",
    borderRadius: 9,
    fontWeight: 700,
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: 22,
    position: "relative" as const,
    cursor: "pointer",
    textDecoration: "none",
    display: "block",
  },
  cardName: { fontSize: 17, fontWeight: 700, color: "#f0f0f0", marginBottom: 10, paddingRight: 32 },
  row: { display: "flex", alignItems: "center", gap: 8, color: "#777", fontSize: 13, marginBottom: 6 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#1e1228",
    color: "#9d6fe8",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    marginTop: 10,
  },
  deleteBtn: {
    position: "absolute" as const,
    top: 14,
    right: 14,
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#333",
    padding: 4,
  },
  empty: { textAlign: "center" as const, padding: "80px 0", color: "#444" },
  emptyTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#555" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEvents()
      .then(setEvents)
      .catch(() => toast.error("Error cargando eventos"))
      .finally(() => setLoading(false));
  }, []);

  async function deleteEvent(e: React.MouseEvent, id: string) {
    e.preventDefault();
    if (!confirm("Eliminar este evento y todas sus entradas?")) return;
    try {
      await api.deleteEvent(id);
      setEvents(ev => ev.filter(ev => ev.id !== id));
      toast.success("Evento eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: 80, color: "#444" }}>Cargando...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.title}>Mis Eventos</h1>
        <Link to="/events/new" style={s.newBtn}>
          <Plus size={16} /> Nuevo evento
        </Link>
      </div>
      {events.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyTitle}>No tenes eventos todavia</div>
          <Link to="/events/new" style={{ ...s.newBtn, display: "inline-flex" }}>
            <Plus size={15} /> Crear primer evento
          </Link>
        </div>
      ) : (
        <div style={s.grid}>
          {events.map(ev => (
            <Link to={`/events/${ev.id}`} style={s.card} key={ev.id}>
              <button
                style={s.deleteBtn}
                onClick={e => deleteEvent(e, ev.id)}
                title="Eliminar"
              >
                <Trash2 size={15} />
              </button>
              <div style={s.cardName}>{ev.name}</div>
              <div style={s.row}>
                <CalendarDays size={13} />
                {formatDate(ev.date)}
              </div>
              <div style={s.row}>
                <MapPin size={13} />
                {ev.venue}
              </div>
              <div style={s.badge}>
                <Users size={12} />
                {ev._count?.invitations ?? 0} entradas
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
