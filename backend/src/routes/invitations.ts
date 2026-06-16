import { Router, Response, Request } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();

// Ruta publica: ver entrada por token
router.get("/public/:token", async (req: Request, res: Response) => {
  const inv = await prisma.invitation.findUnique({
    where: { token: req.params.token },
    include: { event: true },
  });
  if (!inv) {
    res.status(404).json({ error: "Entrada no encontrada" });
    return;
  }
  const qrDataUrl = await QRCode.toDataURL(inv.token, { width: 300, margin: 2 });
  res.json({
    id: inv.id,
    token: inv.token,
    guestName: inv.guestName,
    status: inv.status,
    qrDataUrl,
    event: {
      name: inv.event.name,
      description: inv.event.description,
      date: inv.event.date,
      venue: inv.event.venue,
      imageUrl: inv.event.imageUrl,
    },
  });
});

// Ruta publica: validar QR (boletero)
router.post("/validate", async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: "Token requerido" });
    return;
  }
  const inv = await prisma.invitation.findUnique({
    where: { token },
    include: { event: true },
  });
  if (!inv) {
    res.status(404).json({ ok: false, error: "Entrada no encontrada" });
    return;
  }
  if (inv.status === "entered") {
    res.json({
      ok: false,
      alreadyEntered: true,
      guestName: inv.guestName,
      enteredAt: inv.enteredAt,
      event: { name: inv.event.name, date: inv.event.date, venue: inv.event.venue },
    });
    return;
  }
  const updated = await prisma.invitation.update({
    where: { token },
    data: { status: "entered", enteredAt: new Date() },
    include: { event: true },
  });
  res.json({
    ok: true,
    guestName: updated.guestName,
    enteredAt: updated.enteredAt,
    event: { name: updated.event.name, date: updated.event.date, venue: updated.event.venue },
  });
});

// Rutas autenticadas
const authRouter = Router({ mergeParams: true });
authRouter.use(authMiddleware);

const invSchema = z.object({
  guestName: z.string().min(2),
  guestPhone: z.string().optional(),
});

authRouter.get("/", async (req: AuthRequest, res: Response) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.eventId, creatorId: req.userId },
  });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const invitations = await prisma.invitation.findMany({
    where: { eventId: req.params.eventId },
    orderBy: { createdAt: "desc" },
  });
  res.json(invitations);
});

authRouter.post("/", async (req: AuthRequest, res: Response) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.eventId, creatorId: req.userId },
  });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const parsed = invSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos invalidos", details: parsed.error.flatten() });
    return;
  }
  const inv = await prisma.invitation.create({
    data: {
      eventId: req.params.eventId,
      guestName: parsed.data.guestName,
      guestPhone: parsed.data.guestPhone || null,
    },
  });
  res.status(201).json(inv);
});

authRouter.delete("/:invId", async (req: AuthRequest, res: Response) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.eventId, creatorId: req.userId },
  });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  await prisma.invitation.deleteMany({
    where: { id: req.params.invId, eventId: req.params.eventId },
  });
  res.json({ ok: true });
});

// Generar link de WhatsApp
authRouter.post("/:invId/whatsapp-link", async (req: AuthRequest, res: Response) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.eventId, creatorId: req.userId },
  });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const inv = await prisma.invitation.findFirst({
    where: { id: req.params.invId, eventId: req.params.eventId },
  });
  if (!inv) {
    res.status(404).json({ error: "Entrada no encontrada" });
    return;
  }
  const inviteUrl = `${process.env.FRONTEND_URL}/invite/${inv.token}`;
  const eventDate = new Date(event.date).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const message = encodeURIComponent(
    `Hola ${inv.guestName}, tenes una entrada para *${event.name}*.\n\n` +
    `Fecha: ${eventDate}\nLugar: ${event.venue}\n\n` +
    `Tu entrada con codigo QR:\n${inviteUrl}\n\n` +
    `Para ingresar al evento, mostra el codigo QR en la puerta.`
  );
  const phone = inv.guestPhone ? inv.guestPhone.replace(/\D/g, "") : "";
  const waLink = `https://wa.me/${phone}?text=${message}`;
  await prisma.invitation.update({
    where: { id: inv.id },
    data: { sentVia: "whatsapp", sentAt: new Date() },
  });
  res.json({ ok: true, waLink });
});

router.use("/events/:eventId/invitations", authRouter);
export default router;
