import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, TrendingUp, ShoppingCart, Warehouse, Skull } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_KEY = "morning-summary-shown";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export default function MorningSummaryOverlay() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const todayKey = getTodayKey();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== todayKey) {
      setVisible(true);
    }
  }, [user]);

  const { data, isLoading } = useQuery<{
    success: boolean;
    data: {
      animaliEntrati: number;
      animaliVenduti: number;
      animaliInImpianto: number;
      animaliMortiOSpariti: number;
    };
  }>({
    queryKey: ["/api/morning-summary"],
    enabled: visible,
    staleTime: 60000,
  });

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, getTodayKey());
    setVisible(false);
  };

  if (!visible) return null;

  const summary = data?.data;

  const fmt = (n: number | undefined) =>
    n !== undefined ? n.toLocaleString("it-IT") : "—";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Sfondo semitrasparente */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card centrale */}
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl">
        {/* Sfondo vetro/trasparenza */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20" />

        <div className="relative p-8 text-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-white/70 uppercase tracking-widest mb-1">
                Riepilogo mattutino
              </p>
              <h2 className="text-2xl font-bold">
                Buongiorno{user?.username ? `, ${user.username}` : ""}!
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Dati aggiornati — lotti dal 1 dicembre 2025
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-white/50 text-lg">
              Caricamento dati…
            </div>
          ) : (
            <>
              {/* Griglia 3 statistiche */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Entrati */}
                <div className="rounded-xl bg-white/10 border border-white/20 p-5">
                  <div className="flex items-center gap-2 mb-2 text-emerald-300">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Entrati
                    </span>
                  </div>
                  <p className="text-3xl font-bold">{fmt(summary?.animaliEntrati)}</p>
                  <p className="text-xs text-white/50 mt-1">animali ricevuti</p>
                </div>

                {/* Venduti */}
                <div className="rounded-xl bg-white/10 border border-white/20 p-5">
                  <div className="flex items-center gap-2 mb-2 text-blue-300">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Venduti
                    </span>
                  </div>
                  <p className="text-3xl font-bold">{fmt(summary?.animaliVenduti)}</p>
                  <p className="text-xs text-white/50 mt-1">animali venduti</p>
                </div>

                {/* In impianto */}
                <div className="rounded-xl bg-white/10 border border-white/20 p-5">
                  <div className="flex items-center gap-2 mb-2 text-amber-300">
                    <Warehouse className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      In impianto
                    </span>
                  </div>
                  <p className="text-3xl font-bold">{fmt(summary?.animaliInImpianto)}</p>
                  <p className="text-xs text-white/50 mt-1">animali presenti</p>
                </div>
              </div>

              {/* Morti / Spariti — in grande */}
              <div className="rounded-xl bg-red-900/40 border border-red-400/30 p-6">
                <div className="flex items-center gap-3 mb-3 text-red-300">
                  <Skull className="h-6 w-6" />
                  <span className="text-sm font-semibold uppercase tracking-widest">
                    Morti o spariti
                  </span>
                </div>
                <p className="text-6xl font-black text-red-200 leading-none">
                  {fmt(summary?.animaliMortiOSpariti)}
                </p>
                <p className="text-sm text-red-300/70 mt-2">
                  animali non contabilizzati (entrati − venduti − in impianto)
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors border border-white/20"
            >
              Chiudi e inizia la giornata
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
