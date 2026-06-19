import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.post("/mercadopago", async (req: Request, res: Response) => {
  // Responder 200 inmediatamente para que MP no reintente
  res.sendStatus(200);

  const { type, data } = req.body ?? {};
  if (type !== "payment" || !data?.id) return;

  try {
    const paymentId = data.id;

    // Buscar la invitation por external_reference usando el payment_id
    // Primero necesitamos obtener el pago de MP para saber el external_reference
    // Buscamos el token en alguna invitation que coincida
    const paymentRes = await fetchMpPayment(paymentId);
    if (!paymentRes) return;

    const { status, external_reference } = paymentRes;
    if (status !== "approved" || !external_reference) return;

    const inv = await prisma.invitation.findUnique({
      where: { id: external_reference },
      include: { event: { select: { mpAccessToken: true } } },
    });
    if (!inv || inv.status !== "pending_payment") return;

    // Verificar usando el access_token del evento
    if (inv.event.mpAccessToken) {
      const verified = await fetchMpPayment(paymentId, inv.event.mpAccessToken);
      if (!verified || verified.status !== "approved") return;
    }

    await prisma.invitation.update({
      where: { id: external_reference },
      data: { status: "pending" },
    });
  } catch {
    // silently ignore errors — MP ya recibio el 200
  }
});

async function fetchMpPayment(paymentId: string, accessToken?: string) {
  const token = accessToken || process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json() as { status: string; external_reference: string };
  return data;
}

export default router;
