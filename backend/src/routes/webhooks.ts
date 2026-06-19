import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { fetchMpPayment } from "../lib/mercadopago";

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
      include: { event: { select: { mpAccessToken: true } } },
    });
    if (!inv || inv.status !== "pending_payment") return;

    // Paso 3: verificar con el token del evento propietario.
    // Si el evento no tiene token configurado, rechazar — no hay forma segura de verificar.
    const eventToken = inv.event.mpAccessToken;
    if (!eventToken) return;

    const verified = await fetchMpPayment(paymentId, eventToken);
    if (!verified || verified.status !== "approved") return;

    await prisma.invitation.update({
      where: { id: initial.external_reference },
      data: { status: "pending" },
    });
  } catch {
    // silently ignore — MP ya recibio el 200
  }
});

export default router;
