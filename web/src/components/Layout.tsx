import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Ticket } from "lucide-react";
import { clearSession, getSession } from "../lib/auth";

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: "100vh", background: "#0d0d0d" },
  header: {
    background: "#111",
    borderBottom: "1px solid #222",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#e0e0e0",
    textDecoration: "none",
  },
  logoText: { fontSize: 17, fontWeight: 700, letterSpacing: 0.5 },
  nav: { display: "flex", alignItems: "center", gap: 16 },
  userName: { color: "#666", fontSize: 14 },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #2a2a2a",
    color: "#666",
    padding: "5px 12px",
    borderRadius: 7,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
  },
  main: { maxWidth: 1100, margin: "0 auto", padding: "32px 16px" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const session = getSession();

  function logout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <Link to="/" style={s.logo}>
          <Ticket size={20} color="#777" />
          <span style={s.logoText}>delvipass</span>
        </Link>
        <nav style={s.nav}>
          <span style={s.userName}>{session?.user.name}</span>
          <button onClick={logout} style={s.logoutBtn}>
            <LogOut size={13} /> Salir
          </button>
        </nav>
      </header>
      <main style={s.main}>{children}</main>
    </div>
  );
}
