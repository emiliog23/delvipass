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
    maxWidth: 400,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  logo: { textAlign: "center", marginBottom: 32 },
  title: { fontSize: 22, fontWeight: 700, color: "#f0f0f0", marginTop: 12 },
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
  group: { marginBottom: 16 },
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await api.register(form);
      saveSession(token, user);
      navigate("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <Ticket size={40} color="#7c3aed" />
          <div style={s.title}>Crear cuenta</div>
        </div>
        <form onSubmit={submit}>
          <div style={s.group}>
            <label style={s.label}>Nombre completo</label>
            <input style={s.input} value={form.name} onChange={set("name")} required autoFocus />
          </div>
          <div style={s.group}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={form.email} onChange={set("email")} required />
          </div>
          <div style={s.group}>
            <label style={s.label}>Usuario</label>
            <input style={s.input} value={form.username} onChange={set("username")} required />
          </div>
          <div style={s.group}>
            <label style={s.label}>Contrasena</label>
            <input style={s.input} type="password" value={form.password} onChange={set("password")} required minLength={6} />
          </div>
          <button style={s.btn} disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>
        <div style={s.link}>
          Ya tenes cuenta?{" "}
          <Link to="/login" style={s.a}>
            Ingresar
          </Link>
        </div>
      </div>
    </div>
  );
}
