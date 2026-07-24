import { useQuery } from '@tanstack/react-query';
import {
  Gauge, Thermometer, Wind, Percent, Waves, ArrowUpDown, Loader2, Clock, FlaskConical, Droplets,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface OxygenProbe {
  status: 'online' | 'offline';
  saturation: number | null;
  dissolvedOxygen: number | null;
  temperature: number | null;
  lastUpdate: string | null;
}

interface NH3PHProbe {
  status: 'online' | 'offline';
  ammonia: number | null;
  ph: number | null;
  temperature: number | null;
  lastUpdate: string | null;
}

interface AcquaScadaResponse {
  timestamp: string;
  /** Sonda vivaio ID 70 — campo nuovo (oxygenProbeVivaio) oppure vecchio (oxygenProbe) */
  oxygenProbeVivaio?: OxygenProbe;
  oxygenProbe?: OxygenProbe;
  /** Sonda O2 Flupsy ID 71 */
  oxygenProbeFlupsy?: OxygenProbe;
  /** Sonda NH3/pH ID 72 */
  nh3phProbe?: NH3PHProbe;
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

/** Helper: supporta sia il campo vecchio "oxygenProbe" che il nuovo "oxygenProbeVivaio" */
function getVivaioprobe(data?: AcquaScadaResponse): OxygenProbe | undefined {
  return data?.oxygenProbeVivaio ?? data?.oxygenProbe;
}

/* ─── Card 1: Sonda O₂ Vivaio (ID 70, SEN0681) ─────────────────────────── */
export function AcquaScadaOxygenCard() {
  const { data, isLoading, isError } = useAcquaScada();
  const probe = getVivaioprobe(data);
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
              <p className="font-semibold text-sm">O₂ Vivaio (SEN0681)</p>
              <p className="text-xs text-muted-foreground">AcquaSCADA · ID 70</p>
            </div>
          </div>
          {!isLoading && !isError && <StatusDot online={online} />}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-xs text-muted-foreground text-center py-3">Dati non disponibili</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center text-blue-500"><Percent className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe?.saturation, 1)}</p>
                <p className="text-[10px] text-muted-foreground">% sat O₂</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-emerald-600"><Wind className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe?.dissolvedOxygen, 2)}</p>
                <p className="text-[10px] text-muted-foreground">mg/L O₂</p>
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

/* ─── Card 2: Sonda O₂ Flupsy (ID 71, DFRobot) ──────────────────────────── */
export function AcquaScadaFlupsyCard() {
  const { data, isLoading, isError } = useAcquaScada();
  const probe = data?.oxygenProbeFlupsy;
  const online = probe?.status === 'online' && data?.source.bridgeStatus === 'online';
  const lastUpdate = formatDateTime(probe?.lastUpdate);

  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-teal-500/15 flex items-center justify-center">
              <Droplets className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">O₂ Flupsy (DFRobot)</p>
              <p className="text-xs text-muted-foreground">AcquaSCADA · ID 71</p>
            </div>
          </div>
          {!isLoading && !isError && <StatusDot online={!!probe && online} />}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError || !probe ? (
          <p className="text-xs text-muted-foreground text-center py-3">Dati non disponibili</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center text-blue-500"><Percent className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe.saturation, 1)}</p>
                <p className="text-[10px] text-muted-foreground">% sat O₂</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-teal-600"><Wind className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe.dissolvedOxygen, 2)}</p>
                <p className="text-[10px] text-muted-foreground">mg/L O₂</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-red-500"><Thermometer className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe.temperature, 1)}</p>
                <p className="text-[10px] text-muted-foreground">°C</p>
              </div>
            </div>
            {lastUpdate && (
              <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-teal-100 text-[11px] text-muted-foreground">
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

/* ─── Card 3: Sonda NH₃/pH (ID 72, SEN0711) ─────────────────────────────── */
export function AcquaScadaNH3PHCard() {
  const { data, isLoading, isError } = useAcquaScada();
  const probe = data?.nh3phProbe;
  const online = probe?.status === 'online' && data?.source.bridgeStatus === 'online';
  const lastUpdate = formatDateTime(probe?.lastUpdate);

  const nh3Color = (v: number | null | undefined): string => {
    if (v === null || v === undefined) return 'text-foreground';
    if (v > 0.5) return 'text-red-600';
    if (v > 0.1) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const phColor = (v: number | null | undefined): string => {
    if (v === null || v === undefined) return 'text-foreground';
    if (v < 7.0 || v > 8.5) return 'text-red-600';
    if (v < 7.5 || v > 8.2) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-violet-500/15 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">NH₃/pH (SEN0711)</p>
              <p className="text-xs text-muted-foreground">AcquaSCADA · ID 72</p>
            </div>
          </div>
          {!isLoading && !isError && <StatusDot online={!!probe && online} />}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError || !probe ? (
          <p className="text-xs text-muted-foreground text-center py-3">Dati non disponibili</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center text-violet-500"><FlaskConical className="h-4 w-4" /></div>
                <p className={`text-base font-bold mt-0.5 ${nh3Color(probe.ammonia)}`}>{fmt(probe.ammonia, 3)}</p>
                <p className="text-[10px] text-muted-foreground">mg/L NH₃</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-indigo-500"><Gauge className="h-4 w-4" /></div>
                <p className={`text-base font-bold mt-0.5 ${phColor(probe.ph)}`}>{fmt(probe.ph, 2)}</p>
                <p className="text-[10px] text-muted-foreground">pH</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-red-500"><Thermometer className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(probe.temperature, 1)}</p>
                <p className="text-[10px] text-muted-foreground">°C</p>
              </div>
            </div>
            {lastUpdate && (
              <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-violet-100 text-[11px] text-muted-foreground">
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

/* ─── Card 4: Livelli Idrici ─────────────────────────────────────────────── */
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
              <p className="text-xs text-muted-foreground">AcquaSCADA · aggiorna ogni 30 sec</p>
            </div>
          </div>
          {!isLoading && !isError && <StatusDot online={online} />}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-xs text-muted-foreground text-center py-3">Dati non disponibili</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center text-sky-600"><Waves className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{levels?.vasca?.value != null ? levels.vasca.value.toFixed(1) : '-'}</p>
                <p className="text-[10px] text-muted-foreground">cm · Vasca idrovore</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-cyan-600"><Waves className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{levels?.laguna?.value != null ? levels.laguna.value.toFixed(1) : '-'}</p>
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
