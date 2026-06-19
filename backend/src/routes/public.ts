import { Router, Request, Response } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import prisma from "../lib/prisma";

const router = Router();

router.get("/events/:id", async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      venue: true,
      imageUrl: true,
      capacity: true,
      purchaseEnabled: true,
      mercadoPagoLink: true,
      _count: { select: { invitations: true } },
    },
  });
  if (!event || !event.purchaseEnabled) {
    res.status(404).json({ error: "Evento no disponible para compra" });
    return;
  }
  res.json(event);
});

const purchaseSchema = z.object({
  guestName: z.string().min(2, "Nombre requerido"),
  guestPhone: z.string().min(6, "Telefono requerido"),
});

router.post("/events/:id/purchase", async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      purchaseEnabled: true,
      mercadoPagoLink: true,
      capacity: true,
      _count: { select: { invitations: true } },
    },
  });
  if (!event || !event.purchaseEnabled || !event.mercadoPagoLink) {
    res.status(400).json({ error: "Compra no disponible para este evento" });
    return;
  }
  if (event.capacity && event._count.invitations >= event.capacity) {
    res.status(400).json({ error: "No hay entradas disponibles" });
    return;
  }
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const inv = await prisma.invitation.create({
    data: {
      eventId: req.params.id,
      guestName: parsed.data.guestName,
      guestPhone: parsed.data.guestPhone,
      source: "purchase",
    },
  });
  const qrDataUrl = await QRCode.toDataURL(inv.token, { width: 300, margin: 2 });
  res.status(201).json({
    id: inv.id,
    token: inv.token,
    guestName: inv.guestName,
    qrDataUrl,
    mercadoPagoLink: event.mercadoPagoLink,
  });
});

export default router;
