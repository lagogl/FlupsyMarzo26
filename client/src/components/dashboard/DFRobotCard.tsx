import { useQuery } from '@tanstack/react-query';
import {
  Bot, Thermometer, Wind, Percent, Loader2, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DFRobotProbe {
  saturation?: number | null;
  oxygen?: number | null;
  dissolvedOxygen?: number | null;
  temperature?: number | null;
  status?: string | null;
  online?: boolean | null;
  timestamp?: string | null;
  lastUpdate?: string | null;
  [key: string]: any;
}

interface DFRobotResponse {
  timestamp: string;
  probe: DFRobotProbe | null;
}

function fmt(v: number | null | undefined, d = 1): string {
  if (v === null || v === undefined || isNaN(Number(v))) return '-';
  return Number(v).toFixed(d);
}

export default function DFRobotCard() {
  const { data, isLoading, isError } = useQuery<DFRobotResponse>({
    queryKey: ['/api/df-robot/measurements'],
    refetchInterval: 30 * 1000,
    retry: 1,
  });

  const probe = data?.probe;

  // Stato online: può arrivare come boolean o stringa ("online"/"offline")
  const rawStatus = probe?.online ?? probe?.status;
  const isOnline =
    rawStatus === true ||
    (typeof rawStatus === 'string' && rawStatus.toLowerCase() === 'online');
  const hasStatus = rawStatus !== null && rawStatus !== undefined;

  const tsRaw = probe?.timestamp || probe?.lastUpdate || data?.timestamp;
  const lastUpdate = tsRaw
    ? new Date(tsRaw).toLocaleString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-cyan-500/15 flex items-center justify-center">
              <Bot className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Sonda Ca' Pisani DF Robot</p>
              <p className="text-xs text-muted-foreground">
                Supervisore Delta Futuro · aggiorna ogni 30 sec
              </p>
            </div>
          </div>
          {!isLoading && !isError && hasStatus && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              data-testid="dfrobot-state"
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError || !probe ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Dati non disponibili
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center text-emerald-600"><Wind className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe.dissolvedOxygen ?? probe.oxygen, 1)}</p>
                <p className="text-[10px] text-muted-foreground">mg/L O2</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-blue-500"><Percent className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe.saturation, 0)}</p>
                <p className="text-[10px] text-muted-foreground">% sat O2</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-red-500"><Thermometer className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe.temperature, 1)}</p>
                <p className="text-[10px] text-muted-foreground">°C acqua</p>
              </div>
            </div>

            {lastUpdate && (
              <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-cyan-100 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Ultima lettura: {lastUpdate}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
