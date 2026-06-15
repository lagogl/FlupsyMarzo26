import { useState, useEffect, useRef, RefObject } from "react";
import html2canvas from "html2canvas";
import { Send, Loader2, CheckCircle2, Smartphone, RefreshCw } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WaStatus {
  connected: boolean;
  initializing: boolean;
  hasQr: boolean;
  error: string | null;
  state: string;
  targetGroup: string;
}

interface Props {
  captureRef: RefObject<HTMLElement | null>;
}

export function SendHeatmapWhatsApp({ captureRef }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async (): Promise<WaStatus | null> => {
    try {
      const s = await apiRequest<WaStatus>("/api/whatsapp/status", "GET");
      setStatus(s);
      if (s.hasQr) {
        try {
          const d = await apiRequest<{ qr: string }>("/api/whatsapp/qr", "GET");
          setQr(d.qr);
        } catch {
          setQr(null);
        }
      } else {
        setQr(null);
      }
      return s;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpen = async () => {
    setOpen(true);
    const s = await fetchStatus();
    if (s && !s.connected && !s.initializing) {
      try {
        await apiRequest("/api/whatsapp/connect", "POST");
      } catch {}
      fetchStatus();
    }
  };

  const capturePng = async (): Promise<string> => {
    const el = captureRef.current;
    if (!el) throw new Error("Tabella non trovata sulla pagina");
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  };

  const handleSend = async () => {
    try {
      setSending(true);
      const img = await capturePng();
      const caption = `📊 Mappa termica FLUPSY — ${new Date().toLocaleString("it-IT")}`;
      const data = await apiRequest<{ success: boolean; to?: string; error?: string }>(
        "/api/whatsapp/send-heatmap",
        "POST",
        { imageBase64: img, caption },
      );
      if (!data.success) throw new Error(data.error || "Invio fallito");
      toast({
        title: "Tabella inviata ✅",
        description: `Inviata al gruppo "${data.to}".`,
      });
      setOpen(false);
    } catch (e: any) {
      toast({
        title: "Errore nell'invio",
        description: e?.message || "Riprova più tardi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const connected = status?.connected;

  return (
    <>
      <Button
        onClick={handleOpen}
        size="sm"
        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
        data-testid="button-send-whatsapp"
      >
        <SiWhatsapp className="h-4 w-4" />
        Invia su WhatsApp
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              Invia tabella su WhatsApp
            </DialogTitle>
            <DialogDescription>
              La tabella delle segnalazioni verrà inviata come immagine al gruppo{" "}
              <span className="font-semibold">
                {status?.targetGroup || "Delta Futuro Equipe Tecnica"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {/* Stato connessione */}
          {!status && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Controllo stato connessione…
            </div>
          )}

          {status && !connected && (
            <div className="space-y-3 py-2">
              {qr ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-gray-600 text-center flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4" />
                    Apri WhatsApp sul telefono → Dispositivi collegati → Collega un
                    dispositivo, e inquadra questo codice:
                  </p>
                  <img
                    src={qr}
                    alt="QR WhatsApp"
                    className="w-56 h-56 border rounded-lg"
                    data-testid="img-whatsapp-qr"
                  />
                  <p className="text-xs text-gray-400 text-center">
                    Serve solo la prima volta. Il telefono usato deve essere membro del
                    gruppo di destinazione.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-sm text-gray-500 py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {status.initializing
                    ? "Avvio del collegamento a WhatsApp…"
                    : "Preparazione del codice QR…"}
                </div>
              )}
              {status.error && (
                <p className="text-xs text-red-500 text-center">{status.error}</p>
              )}
            </div>
          )}

          {connected && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4" />
              WhatsApp collegato. Pronto per inviare.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStatus()}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Aggiorna
            </Button>
            <Button
              onClick={handleSend}
              disabled={!connected || sending}
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-confirm-send-whatsapp"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Invio in corso…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Invia ora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
