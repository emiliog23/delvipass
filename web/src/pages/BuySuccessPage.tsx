import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { api, InvitationStatus, resolveImageUrl } from "../lib/api";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d0d0d", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 64px" },
  card: { width: "100%", maxWidth: 480, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16, overflow: "hidden" },
  img: { width: "100%", height: 160, objectFit: "cover" as const, display: "block" },
  body: { padding: "28px 24px", display: "flex", flexDirection: "column" as const, alignItems: "center" },
  qrImg: { width: 220, height: 220, borderRadius: 12, border: "1px solid #2a2a2a", marginBottom: 16 },
  name: { fontSize: 20, fontWeight: 700, color: "#f0f0f0", marginBottom: 16 },
  meta: { display: "flex", alignItems: "center", gap: 8, color: "#666", fontSize: 13, marginBottom: 8, alignSelf: "flex-start" as const },
  hint: { fontSize: 13, color: "#555", textAlign: "center" as const, marginTop: 16, lineHeight: 1.6 },
  spinner: { width: 40, height: 40, border: "3px solid #2a2a2a", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "32px auto" },
};

function badge(ok: boolean): React.CSSProperties {
  return {
    background: ok ? "#0d1f0d" : "#1a1500",
    border: `1px solid ${ok ? "#1a4a1a" : "#3a3000"}`,
    color: ok ? "#4ade80" : "#facc15",
    borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, marginBottom: 20,
  };
}

function isConfirmed(data: InvitationStatus | null) {
  return !!data && (data.status === "pending" || data.status === "entered");
}

export default function BuySuccessPage() {
  const [params] = useSearchParams();
  const invitationId = params.get("external_reference");
  const [data, setData] = useState<InvitationStatus | null>(null);
  const [error, setError] = useState("");
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmedRef = useRef(false);
  const MAX_ATTEMPTS = 15;

  useEffect(() => {
    mountedRef.current = true;

    if (!invitationId) {
      setError("No se recibio el ID de la reserva.");
      return;
    }

    const paymentId = params.get("payment_id") || params.get("collection_id");
    if (paymentId && invitationId) {
      api.confirmPurchase(invitationId, paymentId)
        .then(res => {
          if (!mountedRef.current) return;
          // Marcar ANTES de setData para que el poll en vuelo no sobreescriba
          if (res.status === "pending" || res.status === "entered") {
            confirmedRef.current = true;
          }
          setData(res);
        })
        .catch(() => {});
    }

    async function poll() {
      if (confirmedRef.current || !mountedRef.current) return;
      try {
        const res = await api.getInvitationStatus(invitationId!);
        if (!mountedRef.current) return;
        if (confirmedRef.current) return; // confirmPurchase ya resolvió, no pisar
        setData(res);
        if (res.status === "pending" || res.status === "entered") {
          confirmedRef.current = true;
          return;
        }
      } catch {
        // ignore poll errors
      }

      if (!mountedRef.current) return;
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setError("El pago esta siendo procesado. Recibiras tu entrada en breve por email.");
        return;
      }
      timerRef.current = setTimeout(poll, 2000);
    }

    poll();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [invitationId]);

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.body}>
            <div style={{ ...badge(false), marginBottom: 0 }}>Procesando pago</div>
            <p style={s.hint}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConfirmed(data)) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.body}>
            <div style={badge(false)}>Confirmando pago...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={s.spinner} />
            <p style={s.hint}>Estamos verificando tu pago con MercadoPago.<br />Esto puede tomar unos segundos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {data!.event.imageUrl && (
          <img src={resolveImageUrl(data!.event.imageUrl)} alt={data!.event.name} style={s.img} />
        )}
        <div style={s.body}>
          <div style={badge(true)}>Pago confirmado</div>
          {data!.qrDataUrl && <img src={data!.qrDataUrl} alt="QR" style={s.qrImg} />}
          <div style={s.name}>{data!.guestName}</div>
          {data!.ticketNumber && (
            <div style={{ color: "#555", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
              Entrada #{data!.ticketNumber.toString().padStart(4, "0")}
            </div>
          )}
          <div style={s.meta}><CalendarDays size={14} /> {formatDate(data!.event.date)}</div>
          <div style={s.meta}><MapPin size={14} /> {data!.event.venue}</div>
          <p style={s.hint}>
            Mostrá este código QR en la puerta del evento.<br />
            Si lo deseás, podés tomar una captura de pantalla para guardarlo en tu celular.
          </p>
          <p style={{ ...s.hint, marginTop: 12, color: "#4ade80", fontWeight: 600 }}>
            Te enviamos una copia de tu entrada por mail.
          </p>
        </div>
      </div>
    </div>
  );
}
