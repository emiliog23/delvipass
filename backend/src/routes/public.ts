import { Router, Request, Response } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import prisma from "../lib/prisma";
import { fetchMpPayment } from "../lib/mercadopago";
import { sendTicketEmail } from "../lib/email";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

async function createMpPreference(
  mpAccessToken: string,
  eventName: string,
  price: number,
  guestName: string,
  invitationId: string
) {
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mpAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ id: "entry", title: `Entrada - ${eventName}`, quantity: 1, unit_price: price, currency_id: "ARS" }],
      payer: { name: guestName },
      external_reference: invitationId,
      back_urls: {
        success: `${FRONTEND_URL}/buy/success`,
        failure: `${FRONTEND_URL}/buy/cancel`,
        pending: `${FRONTEND_URL}/buy/pending`,
      },
      auto_return: "approved",
      notification_url: `${BACKEND_URL}/api/webhooks/mercadopago`,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || "Error creando preferencia en MercadoPago");
  }
  return res.json() as Promise<{ id: string; init_point: string; sandbox_init_point: string }>;
}

// Informacion publica del evento (sin access token)
router.get("/events/:id", async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, description: true, date: true, venue: true,
      imageUrl: true, capacity: true, purchaseEnabled: true, price: true,
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
  guestEmail: z.string().email("Email invalido"),
});

// Iniciar compra: crea invitation pending_payment + preferencia MP
router.post("/events/:id/purchase", async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, purchaseEnabled: true, mpAccessToken: true,
      price: true, capacity: true, _count: { select: { invitations: true } },
    },
  });
  if (!event || !event.purchaseEnabled || !event.mpAccessToken || !event.price) {
    res.status(400).json({ error: "Compra no disponible para este evento" });
    return;
  }
  // Excluir pending_payment del conteo — compras abandonadas no deben bloquear nuevas ventas
  const activeCount = await prisma.invitation.count({
    where: { eventId: req.params.id, status: { not: "pending_payment" } },
  });
  if (event.capacity && activeCount >= event.capacity) {
    res.status(400).json({ error: "No hay entradas disponibles" });
    return;
  }
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const ticketNumber = activeCount + 1;

  const inv = await prisma.invitation.create({
    data: {
      eventId: req.params.id,
      guestName: parsed.data.guestName,
      guestEmail: parsed.data.guestEmail,
      source: "purchase",
      status: "pending_payment",
      ticketNumber,
    },
  });

  try {
    const pref = await createMpPreference(
      event.mpAccessToken, event.name, event.price, parsed.data.guestName, inv.id
    );
    res.status(201).json({ invitationId: inv.id, checkoutUrl: pref.init_point });
  } catch (err: unknown) {
    await prisma.invitation.delete({ where: { id: inv.id } });
    res.status(502).json({ error: err instanceof Error ? err.message : "Error con MercadoPago" });
  }
});

// Estado de la invitation (para que la pagina de exito pollee)
router.get("/invitations/:id", async (req: Request, res: Response) => {
  const inv = await prisma.invitation.findUnique({
    where: { id: req.params.id },
    include: { event: { select: { name: true, date: true, venue: true, imageUrl: true } } },
  });
  if (!inv || inv.source !== "purchase") {
    res.status(404).json({ error: "No encontrado" });
    return;
  }
  const qrDataUrl = inv.status !== "pending_payment"
    ? await QRCode.toDataURL(inv.token, { width: 300, margin: 2 })
    : null;
  res.json({
    id: inv.id,
    status: inv.status,
    guestName: inv.guestName,
    ticketNumber: inv.ticketNumber,
    qrDataUrl,
    event: inv.event,
  });
});

// Confirmacion directa post-pago: el front llama esto con el payment_id de la URL de retorno
router.post("/invitations/:id/confirm", async (req: Request, res: Response) => {
  const { paymentId } = req.body;
  if (!paymentId) {
    res.status(400).json({ error: "paymentId requerido" });
    return;
  }

  const inv = await prisma.invitation.findUnique({
    where: { id: req.params.id },
    include: { event: { select: { name: true, date: true, venue: true, imageUrl: true, mpAccessToken: true } } },
  });
  if (!inv || inv.source !== "purchase") {
    res.status(404).json({ error: "No encontrado" });
    return;
  }

  const qrDataUrl = await QRCode.toDataURL(inv.token, { width: 300, margin: 2 });

  // Ya confirmada previamente (webhook llegó antes) — fix A4: incluye ticketNumber
  if (inv.status !== "pending_payment") {
    res.json({ id: inv.id, status: inv.status, guestName: inv.guestName, ticketNumber: inv.ticketNumber, qrDataUrl, event: inv.event });
    return;
  }

  const token = inv.event.mpAccessToken;
  if (!token) {
    res.status(400).json({ error: "Evento sin configuracion de pago" });
    return;
  }

  const payment = await fetchMpPayment(String(paymentId), token);
  if (!payment || payment.status !== "approved" || payment.external_reference !== req.params.id) {
    res.status(402).json({ error: "Pago no aprobado o no corresponde a esta entrada" });
    return;
  }

  // updateMany con condición de status — fix A3: solo el primer llamado (redirect o webhook) envía el email
  const updated = await prisma.invitation.updateMany({
    where: { id: req.params.id, status: "pending_payment" },
    data: { status: "pending", confirmedVia: "redirect" },
  });

  res.json({ id: inv.id, status: "pending", guestName: inv.guestName, ticketNumber: inv.ticketNumber, qrDataUrl, event: inv.event });

  if (updated.count > 0 && inv.guestEmail && inv.ticketNumber) {
    sendTicketEmail({
      to: inv.guestEmail,
      guestName: inv.guestName,
      eventName: inv.event.name,
      eventDate: inv.event.date.toISOString(),
      eventVenue: inv.event.venue,
      qrDataUrl,
      ticketNumber: inv.ticketNumber,
      inviteUrl: `${FRONTEND_URL}/invite/${inv.token}`,
    }).catch(err => console.error("[sendTicketEmail]", err));
  }
});

export default router;
