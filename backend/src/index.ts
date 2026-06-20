import "dotenv/config";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import invitationRoutes from "./routes/invitations";
import publicRoutes from "./routes/public";
import webhookRoutes from "./routes/webhooks";
import superadminRoutes from "./routes/superadmin";
import { uploadDir } from "./lib/upload";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads/events", express.static(uploadDir));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/superadmin", superadminRoutes);

app.get("/health", (_req, res) => res.json({ ok: true, version: "1.0.0" }));

// Global error handler — catches unhandled async errors forwarded via next(err)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
