import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { useIsMobile } from "../hooks/useIsMobile";

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },
  back: {
    color: "#7c3aed",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
    fontSize: 14,
  },
  title: { fontSize: 22, fontWeight: 700, color: "#f0f0f0" },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    maxWidth: 580,
  },
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
  textarea: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #2a2a2a",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
    background: "#111",
    color: "#f0f0f0",
    minHeight: 80,
    resize: "vertical" as const,
  },
  group: { marginBottom: 20 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  imageDropzone: {
    border: "2px dashed #2a2a2a",
    borderRadius: 8,
    padding: "24px",
    textAlign: "center" as const,
    cursor: "pointer",
    background: "#111",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
    color: "#555",
    fontSize: 14,
  },
  imagePreviewWrap: { position: "relative" as const },
  imagePreview: {
    width: "100%",
    height: 180,
    objectFit: "cover" as const,
    borderRadius: 8,
    border: "1px solid #2a2a2a",
    display: "block",
  },
  removeImageBtn: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    background: "rgba(0,0,0,0.7)",
    border: "none",
    borderRadius: "50%",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
  },
  btn: {
    padding: "11px 28px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default function NewEventPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  now.setHours(20, 0, 0, 0);
  const defaultDate = now.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    name: "",
    description: "",
    date: defaultDate,
    venue: "",
    capacity: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const event = await api.createEvent({
        ...form,
        date: new Date(form.date).toISOString(),
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
      });
      if (imageFile) {
        await api.uploadEventImage(event.id, imageFile);
      }
      toast.success("Evento creado");
      navigate(`/events/${event.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear evento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={s.header}>
        <Link to="/" style={s.back}>
          <ArrowLeft size={16} /> Volver
        </Link>
        <h1 style={s.title}>Nuevo Evento</h1>
      </div>
      <div style={{ ...s.card, padding: isMobile ? 18 : 28 }}>
        <form onSubmit={submit}>
          <div style={s.group}>
            <label style={s.label}>Imagen del evento</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <div style={s.imagePreviewWrap}>
                <img src={imagePreview} alt="Preview" style={s.imagePreview} />
                <button type="button" style={s.removeImageBtn} onClick={removeImage}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={s.imageDropzone} onClick={() => fileInputRef.current?.click()}>
                <ImagePlus size={28} color="#444" />
                <span>Hacer clic para seleccionar imagen</span>
                <span style={{ fontSize: 12, color: "#444" }}>JPG, PNG, WebP — max 5MB</span>
              </div>
            )}
          </div>

          <div style={s.group}>
            <label style={s.label}>Nombre del evento</label>
            <input
              style={s.input}
              value={form.name}
              onChange={set("name")}
              required
              autoFocus
              placeholder="Ej: Cumpleanos de Martin"
            />
          </div>
          <div style={s.group}>
            <label style={s.label}>Descripcion</label>
            <textarea
              style={s.textarea}
              value={form.description}
              onChange={set("description")}
              placeholder="Descripcion opcional..."
            />
          </div>
          <div style={{ ...s.row, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <div style={s.group}>
              <label style={s.label}>Fecha y hora</label>
              <input
                style={s.input}
                type="datetime-local"
                value={form.date}
                onChange={set("date")}
                required
              />
            </div>
            <div style={s.group}>
              <label style={s.label}>Capacidad maxima</label>
              <input
                style={s.input}
                type="number"
                value={form.capacity}
                onChange={set("capacity")}
                placeholder="Sin limite"
                min={1}
              />
            </div>
          </div>
          <div style={s.group}>
            <label style={s.label}>Lugar / Direccion</label>
            <input
              style={s.input}
              value={form.venue}
              onChange={set("venue")}
              required
              placeholder="Ej: Salon Los Pinos, Av. Siempreviva 123"
            />
          </div>
          <button style={s.btn} disabled={loading}>
            {loading ? "Creando..." : "Crear evento"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
