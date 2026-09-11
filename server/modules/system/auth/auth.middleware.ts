import type { Request, Response, NextFunction } from "express";

// Augment express-session data with our user payload
declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role: string;
    };
  }
}

/**
 * Middleware di autenticazione basato su sessione.
 * Richiede che l'utente abbia effettuato il login (POST /api/login).
 * Riutilizzabile su qualsiasi route o router sensibile:
 *   app.use('/api/qualcosa', requireAuth, router)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.user?.id) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: "Non autenticato: effettua il login per accedere a questa risorsa",
  });
}

/**
 * Middleware di autorizzazione per le funzioni amministrative.
 * Distingue una sessione assente (401) da un utente autenticato senza ruolo (403).
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user?.id) {
    return res.status(401).json({
      success: false,
      error: "Non autenticato: effettua il login per accedere a questa risorsa",
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Accesso riservato agli amministratori",
    });
  }

  return next();
}
