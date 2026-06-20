import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    if (!payload.userId) throw new Error("Invalid payload");
    req.userId = payload.userId;
    req.username = payload.username;
    req.userRole = payload.role ?? "user";
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function superadminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (req.userRole !== "superadmin") {
      res.status(403).json({ error: "Acceso denegado" });
      return;
    }
    next();
  });
}
