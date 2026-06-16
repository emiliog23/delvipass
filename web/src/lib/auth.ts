import { User } from "./api";

export function saveSession(token: string, user: User) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getSession(): { token: string; user: User } | null {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (!token || !user) return null;
  return { token, user: JSON.parse(user) };
}
