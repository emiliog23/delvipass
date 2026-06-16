const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("No autorizado");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error del servidor");
  return data as T;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    req<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (data: { email: string; username: string; password: string; name: string }) =>
    req<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  // Events
  getEvents: () => req<Event[]>("/events"),
  createEvent: (data: Partial<Event>) =>
    req<Event>("/events", { method: "POST", body: JSON.stringify(data) }),
  getEvent: (id: string) => req<Event>(`/events/${id}`),
  updateEvent: (id: string, data: Partial<Event>) =>
    req<Event>(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEvent: (id: string) =>
    req<{ ok: boolean }>(`/events/${id}`, { method: "DELETE" }),
  uploadEventImage: async (id: string, file: File): Promise<Event> => {
    const token = getToken();
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`${(import.meta.env.VITE_API_URL ?? "")}/api/events/${id}/image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir imagen");
    return data as Event;
  },

  // Invitations
  getInvitations: (eventId: string) =>
    req<Invitation[]>(`/invitations/events/${eventId}/invitations`),
  createInvitation: (eventId: string, data: Partial<Invitation>) =>
    req<Invitation>(`/invitations/events/${eventId}/invitations`, { method: "POST", body: JSON.stringify(data) }),
  deleteInvitation: (eventId: string, invId: string) =>
    req<{ ok: boolean }>(`/invitations/events/${eventId}/invitations/${invId}`, { method: "DELETE" }),
  getWhatsAppLink: (eventId: string, invId: string) =>
    req<{ ok: boolean; waLink: string }>(`/invitations/events/${eventId}/invitations/${invId}/whatsapp-link`, { method: "POST" }),

  // Public
  getPublicInvitation: (token: string) =>
    req<PublicInvitation>(`/invitations/public/${token}`),
};

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  date: string;
  venue: string;
  capacity?: number;
  imageUrl?: string;
  createdAt: string;
  _count?: { invitations: number };
}

export interface Invitation {
  id: string;
  eventId: string;
  guestName: string;
  guestPhone?: string;
  token: string;
  status: "pending" | "entered";
  sentVia?: string;
  sentAt?: string;
  enteredAt?: string;
  createdAt: string;
}

export interface PublicInvitation {
  id: string;
  token: string;
  guestName: string;
  status: string;
  qrDataUrl: string;
  event: {
    name: string;
    description?: string;
    date: string;
    venue: string;
    imageUrl?: string;
  };
}
