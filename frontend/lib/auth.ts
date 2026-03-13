import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import type { AppUser } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "atryn-dev-secret-key-change-in-production";

export interface TokenPayload {
  id: number | string; // userId (string) from DynamoDB or legacy numeric id
  email: string;
  role: "student" | "professor";
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return verifyToken(token);
}
