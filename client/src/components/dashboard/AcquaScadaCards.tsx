import { useQuery } from '@tanstack/react-query';
import {
  Gauge, Thermometer, Wind, Percent, Waves, ArrowUpDown, Loader2, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AcquaScadaResponse {
  timestamp: string;
  oxygenProbe: {
    status: 'online' | 'offline';
    saturation: number | null;
    dissolvedOxygen: number | null;
    temperature: number | null;
    lastUpdate: string | null;
  };
  levels: {
    vasca: { value: number | null; unit: string; lastUpdate: string | null };
    laguna: { value: number | null; unit: string; lastUpdate: string | null };
  };
  source: { bridgeStatus: 'online' | 'offline'; lastError: string | null };
}

function fmt(v: number | null | undefined, d = 2): string {
  if (v === null || v === undefined) return '-';
  return v.toFixed(d);
}

function formatDateTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`}
      title={online ? 'Online' : 'Offline'}
    />
  );
}

export function useAcquaScada() {
  return useQuery<AcquaScadaResponse>({
    queryKey: ['/api/acquascada/measurements'],
    refetchInterval: 30 * 1000,
    retry: 1,
  });
}

export function AcquaScadaOxygenCard() {
  const { data, isLoading, isError } = useAcquaScada();
  const probe = data?.oxygenProbe;
  const online = probe?.status === 'online' && data?.source.bridgeStatus === 'online';
  const lastUpdate = formatDateTime(probe?.lastUpdate);

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Gauge className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Sonda Ossigeno DF</p>
              <p className="text-xs text-muted-foreground">
                AcquaSCADA · aggiorna ogni 30 sec
              </p>
            </div>
          </div>
          {!isLoading && !isError && <StatusDot online={online} />}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Dati non disponibili
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center text-blue-500"><Percent className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe?.saturation, 1)}</p>
                <p className="text-[10px] text-muted-foreground">% sat O2</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-emerald-600"><Wind className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe?.dissolvedOxygen, 2)}</p>
                <p className="text-[10px] text-muted-foreground">mg/L O2</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-red-500"><Thermometer className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe?.temperature, 1)}</p>
                <p className="text-[10px] text-muted-foreground">°C</p>
              </div>
            </div>

            {lastUpdate && (
              <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-emerald-100 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Ultima misura: {lastUpdate}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function AcquaScadaLevelsCard() {
  const { data, isLoading, isError } = useAcquaScada();
  const levels = data?.levels;
  const online = data?.source.bridgeStatus === 'online';
  const lastUpdate = formatDateTime(levels?.vasca?.lastUpdate ?? levels?.laguna?.lastUpdate);

  return (
    <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-sky-500/15 flex items-center justify-center">
              <ArrowUpDown className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Livelli Idrici</p>
              <p className="text-xs text-muted-foreground">
                AcquaSCADA · aggiorna ogni 30 sec
              </p>
            </div>
          </div>
          {!isLoading && !isError && <StatusDot online={online} />}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Dati non disponibili
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center text-sky-600"><Waves className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(levels?.vasca?.value, 1)}</p>
                <p className="text-[10px] text-muted-foreground">cm · Vasca idrovore</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-cyan-600"><Waves className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(levels?.laguna?.value, 1)}</p>
                <p className="text-[10px] text-muted-foreground">cm · Laguna</p>
              </div>
            </div>

            {lastUpdate && (
              <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-sky-100 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Ultima misura: {lastUpdate}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
