const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

export function getToken() {
  return token;
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error del servidor");
  return data as T;
}

export interface ValidateResult {
  ok: boolean;
  alreadyEntered?: boolean;
  guestName?: string;
  enteredAt?: string;
  event?: { name: string; date: string; venue: string };
  error?: string;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  venue: string;
  _count?: { invitations: number };
}

export const api = {
  login: (username: string, password: string) =>
    req<{ token: string; user: { id: string; name: string; username: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getEvents: () => req<EventItem[]>("/events"),

  validateQR: (qrToken: string) =>
    req<ValidateResult>("/invitations/validate", {
      method: "POST",
      body: JSON.stringify({ token: qrToken }),
    }),
};
