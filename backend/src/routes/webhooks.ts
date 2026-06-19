import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { fetchMpPayment } from "../lib/mercadopago";
import { sendTicketEmail } from "../lib/email";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const router = Router();

router.post("/mercadopago", async (req: Request, res: Response) => {
  res.sendStatus(200);

  const { type, data } = req.body ?? {};
  if (type !== "payment" || !data?.id) return;

  try {
    const paymentId = String(data.id);

    // Paso 1: fetch inicial para obtener external_reference.
    // Usamos el token global como primer intento; si no está configurado
    // no podemos continuar sin saber el evento.
    const initialToken = process.env.MP_ACCESS_TOKEN;
    if (!initialToken) return;

    const initial = await fetchMpPayment(paymentId, initialToken);
    if (!initial || initial.status !== "approved" || !initial.external_reference) return;

    // Paso 2: buscar invitation y su token de evento
    const inv = await prisma.invitation.findUnique({
      where: { id: initial.external_reference },
      include: { event: { select: { mpAccessToken: true, name: true, date: true, venue: true } } },
    });
    if (!inv || inv.status !== "pending_payment") return;

    const eventToken = inv.event.mpAccessToken;
    if (!eventToken) return;

    const verified = await fetchMpPayment(paymentId, eventToken);
    if (!verified || verified.status !== "approved") return;

    const updated = await prisma.invitation.updateMany({
      where: { id: initial.external_reference, status: "pending_payment" },
      data: { status: "pending", confirmedVia: "webhook" },
    });

    if (updated.count > 0 && inv.guestEmail && inv.ticketNumber) {
      const QRCode = await import("qrcode");
      const qrDataUrl = await QRCode.toDataURL(inv.token, { width: 300, margin: 2 });
      sendTicketEmail({
        to: inv.guestEmail,
        guestName: inv.guestName,
        eventName: inv.event.name,
        eventDate: inv.event.date.toISOString(),
        eventVenue: inv.event.venue,
        qrDataUrl,
        ticketNumber: inv.ticketNumber,
        inviteUrl: `${FRONTEND_URL}/invite/${inv.token}`,
      }).catch(err => console.error("[sendTicketEmail webhook]", err));
    }
  } catch {
    // silently ignore — MP ya recibio el 200
  }
});

export default router;
