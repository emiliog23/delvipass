import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, MapPin, ShoppingCart, ExternalLink } from "lucide-react";
import { api, PublicEvent, PurchaseResult, resolveImageUrl } from "../lib/api";

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

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d0d0d", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 64px" },
  card: { width: "100%", maxWidth: 480, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16, overflow: "hidden" },
  img: { width: "100%", height: 200, objectFit: "cover" as const, display: "block" },
  body: { padding: "24px 24px 28px" },
  eventName: { fontSize: 22, fontWeight: 800, color: "#f0f0f0", marginBottom: 12 },
  meta: { display: "flex", alignItems: "center", gap: 8, color: "#777", fontSize: 13, marginBottom: 8 },
  divider: { borderColor: "#2a2a2a", margin: "20px 0" },
  label: { display: "block", marginBottom: 6, fontWeight: 600, color: "#888", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #2a2a2a", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" as const, background: "#111", color: "#f0f0f0", marginBottom: 16 },
  group: { marginBottom: 4 },
  buyBtn: { width: "100%", padding: "14px", background: "#009ee3", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  mpBtn: { width: "100%", padding: "14px", background: "#009ee3", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  qrWrap: { display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "24px 24px 28px" },
  qrImg: { width: 220, height: 220, borderRadius: 12, border: "1px solid #2a2a2a", marginBottom: 16 },
  qrName: { fontSize: 20, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 },
  qrHint: { fontSize: 13, color: "#666", textAlign: "center" as const, marginBottom: 24, lineHeight: 1.5 },
  successBadge: { background: "#0d1f0d", border: "1px solid #1a4a1a", color: "#4ade80", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, marginBottom: 20 },
  errorBox: { background: "#1a0d0d", border: "1px solid #3a1a1a", color: "#f87171", borderRadius: 10, padding: "16px 20px", textAlign: "center" as const },
  notFound: { color: "#555", textAlign: "center" as const, paddingTop: 80, fontSize: 16 },
};

export default function BuyPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ guestName: "", guestPhone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getPublicEvent(id)
      .then(setEvent)
      .catch(() => setLoadError(true));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await api.createPurchase(id, form);
      setResult(res);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Error al procesar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div style={s.page}>
        <p style={s.notFound}>Este evento no está disponible para compra.</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={s.page}>
        <p style={{ color: "#555", paddingTop: 80 }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {event.imageUrl && (
          <img src={resolveImageUrl(event.imageUrl)} alt={event.name} style={s.img} />
        )}

        {result ? (
          <div style={s.qrWrap}>
            <div style={s.successBadge}>Entrada generada</div>
            <img src={result.qrDataUrl} alt="QR" style={s.qrImg} />
            <div style={s.qrName}>{result.guestName}</div>
            <div style={s.qrHint}>
              Mostra este codigo QR en la puerta del evento.{"\n"}
              Guarda una captura de pantalla para tenerlo disponible offline.
            </div>
            <a href={result.mercadoPagoLink} target="_blank" rel="noreferrer" style={{ ...s.mpBtn, textDecoration: "none" }}>
              <ExternalLink size={18} /> Pagar con MercadoPago
            </a>
          </div>
        ) : (
          <div style={s.body}>
            <div style={s.eventName}>{event.name}</div>
            <div style={s.meta}><CalendarDays size={14} /> {formatDate(event.date)}</div>
            <div style={s.meta}><MapPin size={14} /> {event.venue}</div>
            {event.capacity && (
              <div style={{ ...s.meta, color: event._count.invitations >= event.capacity ? "#f87171" : "#777" }}>
                {event.capacity - event._count.invitations > 0
                  ? `${event.capacity - event._count.invitations} entradas disponibles`
                  : "Sin entradas disponibles"}
              </div>
            )}

            <hr style={s.divider} />

            {event.capacity && event._count.invitations >= event.capacity ? (
              <div style={s.errorBox}>No hay entradas disponibles para este evento.</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={s.group}>
                  <label style={s.label}>Nombre completo</label>
                  <input
                    style={s.input}
                    value={form.guestName}
                    onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
                    placeholder="Tu nombre y apellido"
                    required
                    autoFocus
                  />
                </div>
                <div style={s.group}>
                  <label style={s.label}>WhatsApp</label>
                  <input
                    style={s.input}
                    value={form.guestPhone}
                    onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))}
                    placeholder="Ej: 5491112345678"
                    required
                  />
                </div>
                {submitError && (
                  <div style={{ ...s.errorBox, marginBottom: 14 }}>{submitError}</div>
                )}
                <button style={s.buyBtn} type="submit" disabled={submitting}>
                  <ShoppingCart size={18} />
                  {submitting ? "Procesando..." : "Obtener entrada"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
