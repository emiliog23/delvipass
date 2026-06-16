import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Ticket } from "lucide-react";
import { api } from "../lib/api";
import { saveSession } from "../lib/auth";

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0d0d0d",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  logo: { textAlign: "center", marginBottom: 32 },
  title: { fontSize: 22, fontWeight: 700, color: "#f0f0f0", marginTop: 12 },
  subtitle: { color: "#555", fontSize: 13, marginTop: 4 },
  label: { display: "block", marginBottom: 6, fontWeight: 600, color: "#888", fontSize: 13 },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #2a2a2a",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
    background: "#111",
    color: "#f0f0f0",
  },
  group: { marginBottom: 18 },
  btn: {
    width: "100%",
    padding: "12px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
  link: { textAlign: "center" as const, marginTop: 20, fontSize: 13, color: "#555" },
  a: { color: "#7c3aed", fontWeight: 600, textDecoration: "none" },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await api.login(form.username, form.password);
      saveSession(token, user);
      navigate("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <Ticket size={40} color="#7c3aed" />
          <div style={s.title}>delvipass</div>
          <div style={s.subtitle}>Ingresa con tu cuenta</div>
        </div>
        <form onSubmit={submit}>
          <div style={s.group}>
            <label style={s.label}>Usuario</label>
            <input
              style={s.input}
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div style={s.group}>
            <label style={s.label}>Contrasena</label>
            <input
              style={s.input}
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button style={s.btn} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <div style={s.link}>
          No tenes cuenta?{" "}
          <Link to="/register" style={s.a}>
            Registrate
          </Link>
        </div>
      </div>
    </div>
  );
}
