import { useQuery } from '@tanstack/react-query';
import {
  Factory, Thermometer, Wind, Percent, Droplets, Loader2, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CaPisaniUnit {
  name: string;
  oxygen: number | null;
  saturation: number | null;
  temperature: number | null;
}

interface CaPisaniResponse {
  timestamp: string;
  sourceTimestamp: string | null;
  systemState: string | null;
  units: CaPisaniUnit[];
  salinity: { value: number | null; temperature: number | null };
  air: { temperature: number | null; o2Saturation: number | null };
}

function fmt(v: number | null | undefined, d = 1): string {
  if (v === null || v === undefined) return '-';
  return v.toFixed(d);
}

export function useCaPisani() {
  return useQuery<CaPisaniResponse>({
    queryKey: ['/api/capisani/measurements'],
    refetchInterval: 30 * 1000,
    retry: 1,
  });
}

export default function CaPisaniCard() {
  const { data, isLoading, isError } = useCaPisani();

  // Mostra l'unità con più valori disponibili (di solito la "2")
  const unit = data?.units
    ?.slice()
    .sort((a, b) => {
      const countA = [a.oxygen, a.saturation, a.temperature].filter((v) => v !== null).length;
      const countB = [b.oxygen, b.saturation, b.temperature].filter((v) => v !== null).length;
      return countB - countA;
    })[0];

  const tsRaw = data?.sourceTimestamp || data?.timestamp;
  const lastUpdate = tsRaw
    ? new Date(tsRaw).toLocaleString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  const inAlarm = (data?.systemState || '').toLowerCase().includes('allarme');

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-orange-500/15 flex items-center justify-center">
              <Factory className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Ca' Pisani</p>
              <p className="text-xs text-muted-foreground">
                KAPPA Sinplant · aggiorna ogni 30 sec
              </p>
            </div>
          </div>
          {!isLoading && !isError && data?.systemState && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${inAlarm ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
              data-testid="capisani-state"
            >
              {data.systemState}
            </span>
          )}
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
                <div className="flex items-center justify-center text-emerald-600"><Wind className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(unit?.oxygen, 1)}</p>
                <p className="text-[10px] text-muted-foreground">mg/L O2</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-blue-500"><Percent className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(unit?.saturation, 0)}</p>
                <p className="text-[10px] text-muted-foreground">% sat O2</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-red-500"><Thermometer className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(unit?.temperature, 1)}</p>
                <p className="text-[10px] text-muted-foreground">°C</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mt-2 pt-2 border-t border-orange-100">
              <div>
                <div className="flex items-center justify-center text-indigo-600"><Droplets className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(data?.salinity?.value, 1)}</p>
                <p className="text-[10px] text-muted-foreground">Salinità (PSU)</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-red-400"><Thermometer className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(data?.salinity?.temperature, 1)}</p>
                <p className="text-[10px] text-muted-foreground">°C sonda salinità</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-sky-500"><Percent className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(data?.air?.o2Saturation, 2)}</p>
                <p className="text-[10px] text-muted-foreground">p.p.m. O2 aria</p>
              </div>
            </div>

            {lastUpdate && (
              <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-orange-100 text-[11px] text-muted-foreground">
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
