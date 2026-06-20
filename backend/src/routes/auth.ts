import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

router.post("/register", asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    return;
  }
  const { email, username, password, name } = parsed.data;
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    res.status(409).json({ error: "Email o usuario ya registrado" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  // Use upsert-like create inside try to handle the TOCTOU race atomically
  const user = await prisma.user.create({ data: { email, username, passwordHash, name } }).catch((e: any) => {
    if (e?.code === "P2002") return null;
    throw e;
  });
  if (!user) {
    res.status(409).json({ error: "Email o usuario ya registrado" });
    return;
  }
  const token = signToken({ userId: user.id, username: user.username, role: user.role });
  res.status(201).json({ token, user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role } });
}));

router.post("/login", asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });
  // Always run bcrypt to avoid timing side-channel on username enumeration
  const dummyHash = "$2a$10$invalidhashpaddingtomatchlength00000000000000000000000";
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, dummyHash).then(() => false);
  if (!user || !valid) {
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    return;
  }
  const token = signToken({ userId: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role } });
}));

export default router;
