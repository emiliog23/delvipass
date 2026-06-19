import { Router, Response } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { uploadEventImage } from "../lib/upload";

const router = Router();
router.use(authMiddleware);

const eventSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  date: z.string().datetime(),
  venue: z.string().min(2),
  capacity: z.number().int().positive().optional(),
  purchaseEnabled: z.boolean().optional(),
  mpAccessToken: z.string().optional(),
  price: z.number().positive().optional(),
});

router.get("/", async (req: AuthRequest, res: Response) => {
  const events = await prisma.event.findMany({
    where: { creatorId: req.userId },
    include: { _count: { select: { invitations: true } } },
    orderBy: { date: "desc" },
  });
  res.json(events);
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos invalidos", details: parsed.error.flatten() });
    return;
  }
  const event = await prisma.event.create({
    data: { ...parsed.data, creatorId: req.userId! },
    include: { _count: { select: { invitations: true } } },
  });
  res.status(201).json(event);
});

router.get("/stats", async (req: AuthRequest, res: Response) => {
  const events = await prisma.event.findMany({
    where: { creatorId: req.userId },
    include: {
      _count: { select: { invitations: true } },
      invitations: { where: { status: "entered" }, select: { id: true } },
    },
    orderBy: { date: "desc" },
  });
  const total = events.reduce((sum, e) => sum + e._count.invitations, 0);
  const entered = events.reduce((sum, e) => sum + e.invitations.length, 0);
  res.json({
    total,
    entered,
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      venue: e.venue,
      total: e._count.invitations,
      entered: e.invitations.length,
    })),
  });
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.id, creatorId: req.userId },
    include: { _count: { select: { invitations: true } } },
  });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  res.json(event);
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  const existing = await prisma.event.findFirst({ where: { id: req.params.id, creatorId: req.userId } });
  if (!existing) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const parsed = eventSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos invalidos", details: parsed.error.flatten() });
    return;
  }
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { _count: { select: { invitations: true } } },
  });
  res.json(event);
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const existing = await prisma.event.findFirst({ where: { id: req.params.id, creatorId: req.userId } });
  if (!existing) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  await prisma.invitation.deleteMany({ where: { eventId: req.params.id } });
  await prisma.event.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Subir o reemplazar imagen del evento
router.post("/:id/image", (req: AuthRequest, res: Response) => {
  uploadEventImage(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: "Archivo invalido o demasiado grande (max 5MB)" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No se recibio ninguna imagen" });
      return;
    }
    const existing = await prisma.event.findFirst({ where: { id: req.params.id, creatorId: req.userId } });
    if (!existing) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: "Evento no encontrado" });
      return;
    }
    // Borrar imagen anterior si existe
    if (existing.imageUrl) {
      const oldPath = path.join(__dirname, "../../uploads/events", path.basename(existing.imageUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const imageUrl = `/uploads/events/${req.file.filename}`;
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { imageUrl },
      include: { _count: { select: { invitations: true } } },
    });
    res.json(event);
  });
});

export default router;
