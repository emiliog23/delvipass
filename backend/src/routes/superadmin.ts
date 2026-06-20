import { Router, Response } from "express";
import { superadminMiddleware, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import prisma from "../lib/prisma";

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

  const emailsSent = purchaseByStatus.find(r => r.status !== "pending_payment")?._count ?? 0;

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
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: "superadmin" },
    select: { id: true, username: true, name: true, role: true },
  });
  res.json(user);
}));

// Revocar superadmin
router.post("/users/:id/demote", asyncHandler<AuthRequest>(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: "user" },
    select: { id: true, username: true, name: true, role: true },
  });
  res.json(user);
}));

export default router;
