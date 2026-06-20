import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16, padding: 36, width: "100%", maxWidth: 400 },
  title: { fontSize: 22, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 },
  subtitle: { color: "#555", fontSize: 14, marginBottom: 28 },
  label: { display: "block", marginBottom: 6, fontWeight: 600, color: "#888", fontSize: 12 },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #2a2a2a", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" as const, background: "#111", color: "#f0f0f0", marginBottom: 20 },
  btn: { width: "100%", padding: 13, background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" },
  back: { display: "block", textAlign: "center" as const, marginTop: 20, color: "#555", fontSize: 13, textDecoration: "none" },
  success: { background: "#0d1f0d", border: "1px solid #1a4a1a", borderRadius: 10, padding: 16, color: "#4ade80", fontSize: 14, lineHeight: 1.6 },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch {
      setError("Error al procesar la solicitud. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>Recuperar contraseña</div>
        <div style={s.subtitle}>Te enviamos un link a tu email para restablecerla.</div>

        {sent ? (
          <>
            <div style={s.success}>
              Si el email está registrado, vas a recibir un link en los próximos minutos.
              Revisá también la carpeta de spam.
            </div>
            <Link to="/login" style={s.back}>Volver al inicio de sesión</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
            />
            {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button style={s.btn} disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </button>
            <Link to="/login" style={s.back}>Volver al inicio de sesión</Link>
          </form>
        )}
      </div>
    </div>
  );
}
