import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, PublicInvitation, resolveImageUrl } from "../lib/api";
import { CalendarDays, MapPin, CheckCircle, Ticket } from "lucide-react";

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0d0d0d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    background: "#1a1a1a",
    borderRadius: 20,
    maxWidth: 420,
    width: "100%",
    overflow: "hidden",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    border: "1px solid #2a2a2a",
  },
  headerNoImage: {
    background: "#111",
    borderBottom: "1px solid #2a2a2a",
    padding: "28px 28px 22px",
    textAlign: "center" as const,
  },
  headerWithImage: {
    borderBottom: "1px solid #2a2a2a",
  },
  headerImage: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  headerOverlay: {
    padding: "16px 24px 20px",
    textAlign: "center" as const,
    background: "#111",
    borderBottom: "1px solid #2a2a2a",
  },
  logoRow: { display: "flex", justifyContent: "center", marginBottom: 12 },
  headerLabel: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase" as const,
    color: "#888",
    marginBottom: 8,
  },
  headerEvent: { fontSize: 22, fontWeight: 700, color: "#f0f0f0" },
  body: { padding: 28 },
  guestName: {
    fontSize: 22,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center" as const,
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#aaa",
    fontSize: 14,
    marginBottom: 10,
  },
  divider: { height: 1, background: "#2a2a2a", margin: "22px 0" },
  qrWrap: {
    textAlign: "center" as const,
    padding: "8px 0",
    background: "#111",
    borderRadius: 12,
    border: "1px solid #2a2a2a",
  },
  qrLabel: {
    fontSize: 10,
    color: "#555",
    marginBottom: 12,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    paddingTop: 16,
  },
  qr: { borderRadius: 8, display: "block", margin: "0 auto 16px" },
  instructions: {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: 16,
    marginTop: 18,
  },
  instrTitle: { fontWeight: 700, color: "#999", marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" as const },
  instrText: { color: "#777", fontSize: 14, lineHeight: 1.6 },
  enteredBadge: {
    background: "#0d1f0d",
    border: "1px solid #1a4a1a",
    borderRadius: 10,
    padding: 16,
    textAlign: "center" as const,
    marginTop: 16,
  },
  enteredText: {
    color: "#4ade80",
    fontWeight: 700,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  errorPage: {
    minHeight: "100vh",
    background: "#0d0d0d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column" as const,
    gap: 12,
  },
  errorText: { color: "#555", fontSize: 17 },
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

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicInvitation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .getPublicInvitation(token)
      .then(setData)
      .catch(() => setError("Entrada no encontrada o invalida."));
  }, [token]);

  if (error) {
    return (
      <div style={s.errorPage}>
        <Ticket size={48} color="#2a2a2a" />
        <p style={s.errorText}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={s.errorPage}>
        <p style={s.errorText}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {data.event.imageUrl ? (
          <div style={s.headerWithImage}>
            <img src={resolveImageUrl(data.event.imageUrl)} alt={data.event.name} style={s.headerImage} />
            <div style={s.headerOverlay}>
              <div style={s.headerLabel}>Entrada</div>
              <div style={s.headerEvent}>{data.event.name}</div>
            </div>
          </div>
        ) : (
          <div style={s.headerNoImage}>
            <div style={s.logoRow}>
              <Ticket size={28} color="#666" />
            </div>
            <div style={s.headerLabel}>Entrada</div>
            <div style={s.headerEvent}>{data.event.name}</div>
          </div>
        )}
        <div style={s.body}>
          <div style={s.guestName}>{data.guestName}</div>
          <div style={s.infoRow}>
            <CalendarDays size={16} color="#555" />
            {formatDate(data.event.date)}
          </div>
          <div style={s.infoRow}>
            <MapPin size={16} color="#555" />
            {data.event.venue}
          </div>
          {data.event.description && (
            <p style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
              {data.event.description}
            </p>
          )}
          <div style={s.divider} />
          <div style={s.qrWrap}>
            <div style={s.qrLabel}>Codigo QR de acceso</div>
            <img
              src={data.qrDataUrl}
              alt="Codigo QR"
              style={s.qr}
              width={220}
              height={220}
            />
          </div>
          {data.status === "entered" ? (
            <div style={s.enteredBadge}>
              <div style={s.enteredText}>
                <CheckCircle size={18} />
                Ya ingresaste al evento
              </div>
            </div>
          ) : (
            <div style={s.instructions}>
              <div style={s.instrTitle}>Instrucciones de acceso</div>
              <div style={s.instrText}>
                Para ingresar al evento, mostra este codigo QR en la puerta.
                La entrada es personal e intransferible.
              </div>
              <div style={{ ...s.instrText, marginTop: 8, color: "#555" }}>
                Si lo deseas, podes tomar una captura de pantalla para guardarla en tu celular.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
