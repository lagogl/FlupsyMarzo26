import { Router } from "express";
import * as wa from "./whatsapp.service";

const router = Router();

// Stato della connessione WhatsApp
router.get("/status", (_req, res) => {
  res.json(wa.getStatus());
});

// Avvia la connessione (genera il QR al primo collegamento)
router.post("/connect", async (_req, res) => {
  try {
    const status = await wa.connect();
    res.json(status);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Restituisce il QR corrente (data URL PNG) da scansionare col telefono
router.get("/qr", (_req, res) => {
  const qr = wa.getQr();
  if (!qr) return res.status(404).json({ error: "Nessun QR disponibile" });
  res.json({ qr });
});

// Invia la tabella della mappa termica (immagine PNG) al gruppo di destinazione
router.post("/send-heatmap", async (req, res) => {
  try {
    const { imageBase64, caption } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ success: false, error: "imageBase64 mancante" });
    }
    const result = await wa.sendImageToTargetGroup(imageBase64, caption || "");
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e?.message || String(e) });
  }
});

export default router;
