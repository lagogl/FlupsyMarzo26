import { useQuery } from '@tanstack/react-query';
import { Thermometer, Droplets, Waves } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BuoyReading {
  temperatura?: number | null;
  ph?: number | null;
  salinita?: number | null;
  ossigenoMgL?: number | null;
  ossigenoSat?: number | null;
  torbidita?: number | null;
  clorofilla?: number | null;
  livelloMare?: number | null;
  conducibilita?: number | null;
}

interface BuoyStation {
  id: string;
  nome: string;
  lat: number;
  lon: number;
  fonte: 'ARPAE' | 'ARPAV';
  attiva: boolean;
  ultimaLettura?: BuoyReading;
  timestamp?: string;
}

interface BuoyDataResponse {
  success: boolean;
  stations: BuoyStation[];
}

const STATION_IDS = [
  { idPattern: 'gorino', namePattern: 'gorino 2', short: 'G2' },
  { idPattern: 'vallona', namePattern: 'vallona', short: 'VA' },
];

function findStation(stations: BuoyStation[], idPattern: string, namePattern: string): BuoyStation | undefined {
  return stations.find(s =>
    s.id.toLowerCase().includes(idPattern) ||
    s.nome.toLowerCase().includes(namePattern)
  );
}

function StationBadge({ station, short }: { station: BuoyStation; short: string }) {
  const r = station.ultimaLettura;
  const hasTemp = r?.temperatura != null;
  const hasSal = r?.salinita != null;
  const hasData = hasTemp || hasSal;
  const timestamp = station.timestamp ? new Date(station.timestamp).toLocaleString('it-IT', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
  }) : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 whitespace-nowrap flex-shrink-0">
            <span className="text-[9px] font-semibold text-white bg-blue-500 px-1 rounded">{short}</span>
            {hasData ? (
              <>
                {hasTemp && (
                  <>
                    <Thermometer className="w-3 h-3 text-orange-500 flex-shrink-0" />
                    <span className="text-[11px] font-bold text-orange-600">{r!.temperatura!.toFixed(1)}°</span>
                  </>
                )}
                {hasSal && (
                  <>
                    <Droplets className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                    <span className="text-[11px] font-bold text-cyan-600">{r!.salinita!.toFixed(1)}‰</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-[10px] text-gray-400 italic">N/D</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-xs">
            <p className="font-semibold">{station.nome} ({station.fonte})</p>
            {timestamp && <p className="text-gray-500">Ultimo dato: {timestamp}</p>}
            {r && (r.temperatura != null || r.salinita != null || r.ossigenoSat != null || r.ph != null) ? (
              <div className="mt-1 space-y-0.5">
                {r.temperatura != null && <p>Temperatura: {r.temperatura.toFixed(2)}°C</p>}
                {r.salinita != null && <p>Salinità: {r.salinita.toFixed(2)} ‰</p>}
                {r.ossigenoSat != null && <p>O₂ Saturazione: {r.ossigenoSat.toFixed(1)}%</p>}
                {r.ossigenoMgL != null && <p>O₂: {r.ossigenoMgL.toFixed(2)} mg/L</p>}
                {r.ph != null && <p>pH: {r.ph.toFixed(2)}</p>}
                {r.torbidita != null && <p>Torbidità: {r.torbidita.toFixed(1)} NTU</p>}
                {r.clorofilla != null && <p>Clorofilla-a: {r.clorofilla.toFixed(2)} µg/L</p>}
              </div>
            ) : (
              <p className="text-gray-400 mt-1">Dati non disponibili al momento</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function BuoyDataBadge() {
  const { data, isLoading } = useQuery<BuoyDataResponse>({
    queryKey: ['/api/buoy-data'],
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
        <Waves className="w-3 h-3 animate-pulse" />
        <span>Boe...</span>
      </div>
    );
  }

  if (!data?.stations) return null;

  const matched = STATION_IDS.map(cfg => ({
    station: findStation(data.stations, cfg.idPattern, cfg.namePattern),
    short: cfg.short
  })).filter(m => m.station);

  if (matched.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {matched.map(m => (
        <StationBadge key={m.station!.id} station={m.station!} short={m.short} />
      ))}
    </div>
  );
}
