import { Router, Request, Response } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { fetchMpPayment } from "../lib/mercadopago";
import { sendTicketEmail } from "../lib/email";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function verifyMpSignature(req: Request): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // si no está configurado, se omite la verificación
  const xSignature = req.headers["x-signature"] as string | undefined;
  const xRequestId = req.headers["x-request-id"] as string | undefined;
  if (!xSignature || !xRequestId) return false;
  const ts = xSignature.match(/ts=(\d+)/)?.[1];
  const v1 = xSignature.match(/v1=([a-f0-9]+)/)?.[1];
  if (!ts || !v1) return false;
  const dataId = (req.body?.data?.id ?? "").toString();
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

const router = Router();

router.post("/mercadopago", async (req: Request, res: Response) => {
  res.sendStatus(200);

  if (!verifyMpSignature(req)) return;

  const { type, data } = req.body ?? {};
  if (type !== "payment" || !data?.id) return;

  try {
    const paymentId = String(data.id);

    // El eventId viene en la notification_url que seteamos al crear la preferencia.
    // Esto elimina la dependencia del token global MP_ACCESS_TOKEN.
    const eventId = req.query.eventId as string | undefined;
    if (!eventId) return;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { mpAccessToken: true, name: true, date: true, venue: true, imageUrl: true },
    });
    if (!event?.mpAccessToken) return;

    // Verificar el pago usando el token del evento (cuenta MP del organizador)
    const payment = await fetchMpPayment(paymentId, event.mpAccessToken);
    if (!payment || payment.status !== "approved" || !payment.external_reference) return;

    const inv = await prisma.invitation.findUnique({
      where: { id: payment.external_reference },
    });
    if (!inv || inv.status !== "pending_payment" || inv.eventId !== eventId) return;

    const updated = await prisma.invitation.updateMany({
      where: { id: payment.external_reference, status: "pending_payment" },
      data: { status: "pending", confirmedVia: "webhook" },
    });

    if (updated.count > 0 && inv.guestEmail && inv.ticketNumber) {
      const QRCode = await import("qrcode");
      const qrDataUrl = await QRCode.toDataURL(inv.token, { width: 300, margin: 2 });
      sendTicketEmail({
        to: inv.guestEmail,
        guestName: inv.guestName,
        eventName: event.name,
        eventDate: event.date.toISOString(),
        eventVenue: event.venue,
        eventImageUrl: event.imageUrl,
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
