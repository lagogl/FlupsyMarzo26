import type { Express, RequestHandler } from "express";
import { requireAuth } from "../../system/auth/auth.middleware";

export function registerDdtSendRoute(
  app: Express,
  sendDDTToFIC: RequestHandler
) {
  app.post("/api/ddt/:ddtId/send-to-fic", requireAuth, sendDDTToFIC);
}