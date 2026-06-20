import { Router, Response } from "express";
import { superadminMiddleware, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import prisma from "../lib/prisma";
import { fetchMpPayment } from "../lib/mercadopago";
import { sendTicketEmail } from "../lib/email";
import QRCode from "qrcode";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const router = Router();
router.use(superadminMiddleware);

router.get("/stats", asyncHandler<AuthRequest>(async (_req, res) => {
  const [
    totalUsers,
    totalEvents,
    totalInvitations,
    totalManual,
    totalPurchase,
    totalEntered,
    purchaseByStatus,
    purchaseByConfirmedVia,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.invitation.count(),
    prisma.invitation.count({ where: { source: "manual" } }),
    prisma.invitation.count({ where: { source: "purchase" } }),
    prisma.invitation.count({ where: { status: "entered" } }),
    prisma.invitation.groupBy({
      by: ["status"],
      where: { source: "purchase" },
      _count: true,
    }),
    prisma.invitation.groupBy({
      by: ["confirmedVia"],
      where: { source: "purchase", status: { not: "pending_payment" } },
      _count: true,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, username: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { events: true } } },
    }),
  ]);

  res.json({
    totalUsers,
    totalEvents,
    totalInvitations,
    totalManual,
    totalPurchase,
    totalEntered,
    emailsSent: purchaseByStatus.filter(r => r.status !== "pending_payment").reduce((s, r) => s + r._count, 0),
    purchaseConfirmations: {
      webhook: purchaseByConfirmedVia.find(r => r.confirmedVia === "webhook")?._count ?? 0,
      redirect: purchaseByConfirmedVia.find(r => r.confirmedVia === "redirect")?._count ?? 0,
      pending: purchaseByStatus.find(r => r.status === "pending_payment")?._count ?? 0,
    },
    recentUsers,
  });
}));

// Promover usuario a superadmin
router.post("/users/:id/promote", asyncHandler<AuthRequest>(async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!target) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: "superadmin" },
    select: { id: true, username: true, name: true, role: true },
  });
  res.json(user);
}));

// Revocar superadmin
router.post("/users/:id/demote", asyncHandler<AuthRequest>(async (req, res) => {
  if (req.params.id === req.userId) {
    res.status(400).json({ error: "No podés revocar tu propio rol de superadmin" });
    return;
  }
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!target) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: "user" },
    select: { id: true, username: true, name: true, role: true },
  });
  res.json(user);
}));

// Reconciliación: verifica pagos pending_payment contra la API de MP y activa los confirmados
router.post("/reconcile", asyncHandler<AuthRequest>(async (_req, res) => {
  // Invitations pendientes de pago con más de 5 minutos de antigüedad
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);
  const pending = await prisma.invitation.findMany({
    where: { status: "pending_payment", source: "purchase", createdAt: { lt: cutoff } },
    include: { event: { select: { mpAccessToken: true, name: true, date: true, venue: true, imageUrl: true } } },
  });

  let activated = 0;
  let failed = 0;

  for (const inv of pending) {
    try {
      if (!inv.event.mpAccessToken) continue;
      // Buscar pagos de MP con este external_reference
      const searchRes = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_references=${inv.id}&status=approved`,
        { headers: { Authorization: `Bearer ${inv.event.mpAccessToken}` } }
      );
      if (!searchRes.ok) continue;
      const { results } = await searchRes.json() as { results: { status: string; external_reference: string }[] };
      const paid = results.find(r => r.status === "approved" && r.external_reference === inv.id);
      if (!paid) continue;

      const updated = await prisma.invitation.updateMany({
        where: { id: inv.id, status: "pending_payment" },
        data: { status: "pending", confirmedVia: "reconcile" },
      });
      if (updated.count === 0) continue;
      activated++;

      // Enviar email si tiene los datos necesarios
      if (inv.guestEmail && inv.ticketNumber) {
        const qrDataUrl = await QRCode.toDataURL(inv.token, { width: 300, margin: 2 });
        sendTicketEmail({
          to: inv.guestEmail,
          guestName: inv.guestName,
          eventName: inv.event.name,
          eventDate: inv.event.date.toISOString(),
          eventVenue: inv.event.venue,
          eventImageUrl: inv.event.imageUrl,
          qrDataUrl,
          ticketNumber: inv.ticketNumber,
          inviteUrl: `${FRONTEND_URL}/invite/${inv.token}`,
        }).catch(err => console.error("[reconcile email]", err));
      }
    } catch {
      failed++;
    }
  }

  res.json({ checked: pending.length, activated, failed });
}));

export default router;
