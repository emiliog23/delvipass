import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Plus, MessageCircle, CheckCircle, Clock,
  Trash2, ExternalLink, Users, CalendarDays, MapPin, ImagePlus,
} from "lucide-react";
import { api, Event, Invitation } from "../lib/api";
import Layout from "../components/Layout";

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
  back: {
    color: "#7c3aed",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
    fontSize: 14,
  },
  eventCard: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  eventImage: {
    width: "100%",
    height: 200,
    objectFit: "cover" as const,
    display: "block",
  },
  eventImagePlaceholder: {
    width: "100%",
    height: 140,
    background: "#111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    gap: 8,
    color: "#444",
    fontSize: 14,
    borderBottom: "1px solid #222",
  },
  eventImageOverlay: {
    position: "relative" as const,
    cursor: "pointer",
  },
  eventImageBtn: {
    position: "absolute" as const,
    bottom: 10,
    right: 10,
    background: "rgba(0,0,0,0.75)",
    border: "1px solid #444",
    borderRadius: 7,
    color: "#ccc",
    padding: "5px 10px",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  eventBody: { padding: "22px 26px" },
  eventName: { fontSize: 22, fontWeight: 700, color: "#f0f0f0", marginBottom: 10 },
  eventDesc: { color: "#666", marginBottom: 10, fontSize: 14 },
  metaRow: { display: "flex", gap: 20, flexWrap: "wrap" as const },
  meta: { display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#777" },
  statsRow: { display: "flex", gap: 12, marginBottom: 24 },
  stat: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: "14px 18px",
    flex: 1,
    textAlign: "center" as const,
  },
  statNum: { fontSize: 26, fontWeight: 700, color: "#f0f0f0" },
  statLabel: { fontSize: 12, color: "#555", marginTop: 2 },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#ccc" },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  form: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
  },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  label: { display: "block", marginBottom: 4, fontWeight: 600, color: "#777", fontSize: 12 },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1.5px solid #2a2a2a",
    borderRadius: 7,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
    background: "#111",
    color: "#f0f0f0",
  },
  saveBtn: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "8px 20px",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },
  cancelBtn: {
    background: "transparent",
    color: "#555",
    border: "1px solid #2a2a2a",
    padding: "8px 16px",
    borderRadius: 7,
    cursor: "pointer",
    marginLeft: 8,
    fontWeight: 600,
    fontSize: 14,
  },
  table: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    overflow: "hidden",
  },
  th: {
    padding: "10px 16px",
    textAlign: "left" as const,
    fontSize: 11,
    fontWeight: 700,
    color: "#555",
    background: "#111",
    borderBottom: "1px solid #222",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  td: { padding: "12px 16px", borderBottom: "1px solid #1f1f1f", fontSize: 13, color: "#ccc" },
  actions: { display: "flex", gap: 6, flexWrap: "wrap" as const },
  actionBtn: {
    border: "none",
    padding: "5px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ guestName: "", guestPhone: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingImage(true);
    try {
      const updated = await api.uploadEventImage(id, file);
      setEvent(updated);
      toast.success("Imagen actualizada");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load(initial = false) {
      try {
        if (initial) {
          const [ev, invs] = await Promise.all([api.getEvent(id!), api.getInvitations(id!)]);
          if (!mounted) return;
          setEvent(ev);
          setInvitations(invs);
        } else {
          const invs = await api.getInvitations(id!);
          if (mounted) setInvitations(invs);
        }
      } catch {
        if (initial && mounted) toast.error("Error cargando el evento");
      } finally {
        if (initial && mounted) setLoading(false);
      }
    }

    load(true);
    const interval = setInterval(() => load(false), 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, [id]);

  async function addInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const inv = await api.createInvitation(id, formData);
      setInvitations(prev => [inv, ...prev]);
      setFormData({ guestName: "", guestPhone: "" });
      setShowForm(false);
      toast.success("Entrada creada");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear entrada");
    } finally {
      setSaving(false);
    }
  }

  async function deleteInvitation(invId: string) {
    if (!id || !confirm("Eliminar esta entrada?")) return;
    try {
      await api.deleteInvitation(id, invId);
      setInvitations(prev => prev.filter(i => i.id !== invId));
      toast.success("Entrada eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  async function openWhatsApp(inv: Invitation) {
    if (!id) return;
    try {
      const { waLink } = await api.getWhatsAppLink(id, inv.id);
      window.open(waLink, "_blank");
      setInvitations(prev =>
        prev.map(i =>
          i.id === inv.id ? { ...i, sentVia: "whatsapp", sentAt: new Date().toISOString() } : i
        )
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al generar link");
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: 80, color: "#444" }}>Cargando...</div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div style={{ padding: 40, color: "#555" }}>Evento no encontrado</div>
      </Layout>
    );
  }

  const entered = invitations.filter(i => i.status === "entered").length;

  return (
    <Layout>
      <div style={s.header}>
        <Link to="/" style={s.back}>
          <ArrowLeft size={16} /> Mis eventos
        </Link>
      </div>

      <div style={s.eventCard}>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageUpload}
        />
        {event.imageUrl ? (
          <div style={s.eventImageOverlay}>
            <img
              src={event.imageUrl}
              alt={event.name}
              style={s.eventImage}
            />
            <button
              style={s.eventImageBtn}
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
            >
              <ImagePlus size={13} />
              {uploadingImage ? "Subiendo..." : "Cambiar imagen"}
            </button>
          </div>
        ) : (
          <div
            style={s.eventImagePlaceholder}
            onClick={() => imageInputRef.current?.click()}
          >
            <ImagePlus size={20} />
            {uploadingImage ? "Subiendo..." : "Agregar imagen del evento"}
          </div>
        )}
        <div style={s.eventBody}>
          <div style={s.eventName}>{event.name}</div>
          {event.description && <div style={s.eventDesc}>{event.description}</div>}
          <div style={s.metaRow}>
            <span style={s.meta}>
              <CalendarDays size={14} /> {formatDate(event.date)}
            </span>
            <span style={s.meta}>
              <MapPin size={14} /> {event.venue}
            </span>
            {event.capacity && (
              <span style={s.meta}>
                <Users size={14} /> Capacidad: {event.capacity}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={s.statsRow}>
        <div style={s.stat}>
          <div style={s.statNum}>{invitations.length}</div>
          <div style={s.statLabel}>Entradas emitidas</div>
        </div>
        <div style={s.stat}>
          <div style={{ ...s.statNum, color: "#4ade80" }}>{entered}</div>
          <div style={s.statLabel}>Ingresaron</div>
        </div>
        <div style={s.stat}>
          <div style={{ ...s.statNum, color: "#facc15" }}>{invitations.length - entered}</div>
          <div style={s.statLabel}>Pendientes</div>
        </div>
      </div>

      <div style={s.sectionHeader}>
        <div style={s.sectionTitle}>Lista de invitados</div>
        <button style={s.addBtn} onClick={() => setShowForm(v => !v)}>
          <Plus size={14} /> Agregar invitado
        </button>
      </div>

      {showForm && (
        <form style={s.form} onSubmit={addInvitation}>
          <div style={s.formRow}>
            <div>
              <label style={s.label}>Nombre</label>
              <input
                style={s.input}
                value={formData.guestName}
                onChange={e => setFormData(f => ({ ...f, guestName: e.target.value }))}
                required
                autoFocus
                placeholder="Nombre del invitado"
              />
            </div>
            <div>
              <label style={s.label}>Telefono (WhatsApp)</label>
              <input
                style={s.input}
                value={formData.guestPhone}
                onChange={e => setFormData(f => ({ ...f, guestPhone: e.target.value }))}
                placeholder="Ej: 5491112345678"
              />
            </div>
          </div>
          <button style={s.saveBtn} type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Agregar"}
          </button>
          <button style={s.cancelBtn} type="button" onClick={() => setShowForm(false)}>
            Cancelar
          </button>
        </form>
      )}

      <div style={s.table}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={s.th}>Nombre</th>
              <th style={s.th}>Telefono</th>
              <th style={s.th}>Estado</th>
              <th style={s.th}>Envio</th>
              <th style={s.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ ...s.td, textAlign: "center", color: "#333", padding: 32 }}
                >
                  No hay invitados aun
                </td>
              </tr>
            ) : (
              invitations.map(inv => (
                <tr key={inv.id}>
                  <td style={s.td}>
                    <strong style={{ color: "#e0e0e0" }}>{inv.guestName}</strong>
                  </td>
                  <td style={{ ...s.td, color: "#666" }}>{inv.guestPhone || "—"}</td>
                  <td style={s.td}>
                    {inv.status === "entered" ? (
                      <span
                        style={{
                          ...s.statusBadge,
                          background: "#0d1f0d",
                          color: "#4ade80",
                          border: "1px solid #1a4a1a",
                        }}
                      >
                        <CheckCircle size={10} /> Ingreso
                      </span>
                    ) : (
                      <span
                        style={{
                          ...s.statusBadge,
                          background: "#1a1500",
                          color: "#facc15",
                          border: "1px solid #3a3000",
                        }}
                      >
                        <Clock size={10} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td style={{ ...s.td, color: "#555", fontSize: 12 }}>
                    {inv.sentAt ? "Enviado" : "—"}
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      <a
                        href={`/invite/${inv.token}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          ...s.actionBtn,
                          background: "#1e1228",
                          color: "#9d6fe8",
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={11} /> Ver
                      </a>
                      <button
                        style={{ ...s.actionBtn, background: "#0d1a0d", color: "#4ade80" }}
                        onClick={() => openWhatsApp(inv)}
                      >
                        <MessageCircle size={11} /> WhatsApp
                      </button>
                      <button
                        style={{ ...s.actionBtn, background: "#1a0d0d", color: "#f87171" }}
                        onClick={() => deleteInvitation(inv.id)}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
