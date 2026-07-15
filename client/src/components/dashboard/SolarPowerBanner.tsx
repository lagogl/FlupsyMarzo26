import { useQuery } from "@tanstack/react-query";
import { Sun, AlertTriangle, Zap } from "lucide-react";

interface SolarStatus {
  configured: boolean;
  powerW: number | null;
  energyTodayWh: number | null;
  lastUpdateTime: string | null;
  stale: boolean;
  alarm: boolean;
  error: string | null;
}

function formatPower(w: number): string {
  if (w >= 1000) return `${(w / 1000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} kW`;
  return `${Math.round(w)} W`;
}

function formatEnergy(wh: number): string {
  return `${(wh / 1000).toLocaleString("it-IT", { maximumFractionDigits: 1 })} kWh`;
}

export default function SolarPowerBanner() {
  const { data } = useQuery<SolarStatus>({
    queryKey: ["/api/solaredge/status"],
    refetchInterval: 5 * 60 * 1000, // il server ha cache 5 min (limite 300 chiamate/giorno SolarEdge)
    staleTime: 4 * 60 * 1000,
  });

  if (!data || !data.configured) return null;

  const { powerW, energyTodayWh, lastUpdateTime, alarm, stale, error } = data;

  if (alarm) {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-red-500 bg-red-50 px-4 py-2.5 mb-4 animate-pulse">
        <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-red-700 text-sm sm:text-base">
            ALLARME FOTOVOLTAICO: nessuna produzione di energia
          </div>
          <div className="text-xs text-red-600">
            {stale
              ? `Dati fermi ${lastUpdateTime ? `dalle ${lastUpdateTime.slice(11, 16)}` : "da oltre un'ora"} — verificare inverter/connessione`
              : `Potenza attuale ${powerW !== null ? formatPower(powerW) : "n.d."} in pieno giorno — verificare l'impianto`}
            {energyTodayWh !== null && ` · Prodotti oggi: ${formatEnergy(energyTodayWh)}`}
          </div>
        </div>
        <Sun className="h-6 w-6 text-red-400 shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-2 mb-4">
      <Sun className="h-5 w-5 text-amber-500 shrink-0" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm">
        <span className="font-semibold text-gray-700">Fotovoltaico</span>
        {error && powerW === null ? (
          <span className="text-xs text-gray-500">{error}</span>
        ) : (
          <>
            <span className="flex items-center gap-1 text-gray-700">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {powerW !== null ? formatPower(powerW) : "n.d."}
            </span>
            {energyTodayWh !== null && (
              <span className="text-gray-600">Oggi: {formatEnergy(energyTodayWh)}</span>
            )}
            {lastUpdateTime && (
              <span className="text-xs text-gray-400">agg. {lastUpdateTime.slice(11, 16)}</span>
            )}
            {error && <span className="text-xs text-orange-500">{error}</span>}
          </>
        )}
      </div>
    </div>
  );
}
