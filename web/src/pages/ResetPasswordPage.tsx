import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
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
  error: { background: "#1a0d0d", border: "1px solid #3a1a1a", borderRadius: 8, padding: "12px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 },
};

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setLoading(true);
    setError("");
    try {
      await api.resetPassword(token, password);
      navigate("/login?reset=ok");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "El link es inválido o expiró.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.error}>Link inválido. Solicitá uno nuevo desde la pantalla de inicio de sesión.</div>
          <Link to="/login" style={s.back}>Volver al inicio de sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>Nueva contraseña</div>
        <div style={s.subtitle}>Elegí una contraseña segura para tu cuenta.</div>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Nueva contraseña</label>
          <input
            style={s.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            autoFocus
          />
          <label style={s.label}>Confirmar contraseña</label>
          <input
            style={s.input}
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repetí la contraseña"
            required
          />
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} disabled={loading}>
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
          <Link to="/login" style={s.back}>Cancelar</Link>
        </form>
      </div>
    </div>
  );
}
