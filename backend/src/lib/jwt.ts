import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET!;

export function signToken(payload: { userId: string; username: string }) {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; username: string } {
  return jwt.verify(token, secret) as { userId: string; username: string };
}
