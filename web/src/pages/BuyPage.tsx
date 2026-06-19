import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, MapPin, ShoppingCart } from "lucide-react";
import { api, PublicEvent, resolveImageUrl } from "../lib/api";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d0d0d", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 64px" },
  card: { width: "100%", maxWidth: 480, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16, overflow: "hidden" },
  img: { width: "100%", height: 200, objectFit: "cover" as const, display: "block" },
  body: { padding: "24px 24px 28px" },
  eventName: { fontSize: 22, fontWeight: 800, color: "#f0f0f0", marginBottom: 12 },
  meta: { display: "flex", alignItems: "center", gap: 8, color: "#777", fontSize: 13, marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 800, color: "#7c3aed", margin: "16px 0 4px" },
  priceLabel: { color: "#555", fontSize: 12, marginBottom: 20 },
  divider: { borderColor: "#2a2a2a", margin: "20px 0" },
  label: { display: "block", marginBottom: 6, fontWeight: 600, color: "#888", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #2a2a2a", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" as const, background: "#111", color: "#f0f0f0", marginBottom: 16 },
  buyBtn: { width: "100%", padding: "14px", background: "#009ee3", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  errorBox: { background: "#1a0d0d", border: "1px solid #3a1a1a", color: "#f87171", borderRadius: 10, padding: "14px 18px", textAlign: "center" as const, marginBottom: 14, fontSize: 14 },
  notFound: { color: "#555", textAlign: "center" as const, paddingTop: 80, fontSize: 16 },
};

export default function BuyPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ guestName: "", guestEmail: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getPublicEvent(id).then(setEvent).catch(() => setLoadError(true));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await api.createPurchase(id, { guestName: form.guestName, guestEmail: form.guestEmail });
      window.location.href = res.checkoutUrl;
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Error al procesar");
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <div style={s.page}><p style={s.notFound}>Este evento no está disponible para compra.</p></div>;
  }
  if (!event) {
    return <div style={s.page}><p style={{ color: "#555", paddingTop: 80 }}>Cargando...</p></div>;
  }

  const soldOut = !!(event.capacity && event._count.invitations >= event.capacity);

  return (
    <div style={s.page}>
      <div style={s.card}>
        {event.imageUrl && <img src={resolveImageUrl(event.imageUrl)} alt={event.name} style={s.img} />}
        <div style={s.body}>
          <div style={s.eventName}>{event.name}</div>
          <div style={s.meta}><CalendarDays size={14} /> {formatDate(event.date)}</div>
          <div style={s.meta}><MapPin size={14} /> {event.venue}</div>
          {event.price && (
            <>
              <div style={s.price}>$ {event.price.toLocaleString("es-AR")}</div>
              <div style={s.priceLabel}>por persona</div>
            </>
          )}
          {event.capacity && (
            <div style={{ ...s.meta, color: soldOut ? "#f87171" : "#777" }}>
              {soldOut ? "Sin entradas disponibles" : `${event.capacity - event._count.invitations} entradas disponibles`}
            </div>
          )}

          <hr style={s.divider} />

          {soldOut ? (
            <div style={{ ...s.errorBox, marginBottom: 0 }}>No hay entradas disponibles para este evento.</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label style={s.label}>Nombre completo</label>
              <input
                style={s.input} value={form.guestName} required autoFocus
                onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
                placeholder="Tu nombre y apellido"
              />
              <label style={s.label}>Email</label>
              <input
                type="email"
                style={s.input} value={form.guestEmail} required
                onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))}
                placeholder="tu@email.com"
              />
              {submitError && <div style={s.errorBox}>{submitError}</div>}
              <button style={s.buyBtn} type="submit" disabled={submitting}>
                <ShoppingCart size={18} />
                {submitting ? "Redirigiendo a MercadoPago..." : "Comprar entrada"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
