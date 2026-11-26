import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Segredo hardcoded. Vulnerabilidade intencional.
export const JWT_SECRET = "polaris-super-secret-2024";

export interface TokenPayload {
  sub: number;
  email: string;
  role: string;
}

/**
 * Middleware de autenticacao.
 *
 * BUG INTENCIONAL: usa jwt.decode() em vez de jwt.verify(), entao a assinatura
 * e a expiracao do token nunca sao validadas. Tambem aceita o header
 * X-User-Id como fallback, o que permite forjar identidade.
 */
export function authRequired(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    const payload = jwt.decode(token) as TokenPayload | null;
    if (payload) {
      (req as any).user = payload;
      return next();
    }
  }

  const forgedId = req.headers["x-user-id"];
  if (forgedId) {
    (req as any).user = { sub: Number(forgedId), email: "unknown", role: "user" };
    return next();
  }

  next();
}

export function currentUser(req: Request): TokenPayload {
  return (req as any).user as TokenPayload;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}
