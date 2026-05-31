import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Waves, Thermometer, Droplets, FlaskConical, Wind, ChevronRight, Loader2,
  TrendingUp, TrendingDown, Minus, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CurrentResponse {
  source: 'live' | 'stored';
  reading: {
    deviceName: string;
    recordDate?: string;
    temperature: number | null;
    ph: number | null;
    nh3: number | null;
    o2: number | null;
    temperatureTrend?: number | null;
    phTrend?: number | null;
    nh3Trend?: number | null;
    o2Trend?: number | null;
  };
}

function fmt(v: number | null | undefined, d = 2): string {
  if (v === null || v === undefined) return '-';
  return v.toFixed(d);
}

function TrendIcon({ trend }: { trend: number | null | undefined }) {
  if (trend === null || trend === undefined) return null;
  if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
  if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
  return <Minus className="h-3 w-3 text-gray-400" />;
}

function formatDateTime(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SeneyeCard() {
  const { data, isLoading } = useQuery<CurrentResponse>({
    queryKey: ['/api/seneye/current'],
    refetchInterval: 5 * 60 * 1000,
  });

  const r = data?.reading;
  const lastMeasure = formatDateTime(r?.recordDate);

  return (
    <Link href="/sonda-df-sifoni">
      <Card className="cursor-pointer hover:shadow-md transition-shadow border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-cyan-500/15 flex items-center justify-center">
                <Waves className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Sonda DF SIFONI</p>
                <p className="text-xs text-muted-foreground">
                  {data?.source === 'stored' ? 'Ultimo dato salvato' : 'In tempo reale'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="flex items-center justify-center text-red-500"><Thermometer className="h-4 w-4" /></div>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    <p className="text-base font-bold">{fmt(r?.temperature, 1)}</p>
                    <TrendIcon trend={r?.temperatureTrend} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">°C</p>
                </div>
                <div>
                  <div className="flex items-center justify-center text-purple-500"><Droplets className="h-4 w-4" /></div>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    <p className="text-base font-bold">{fmt(r?.ph, 2)}</p>
                    <TrendIcon trend={r?.phTrend} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">pH</p>
                </div>
                <div>
                  <div className="flex items-center justify-center text-yellow-600"><FlaskConical className="h-4 w-4" /></div>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    <p className="text-base font-bold">{fmt(r?.nh3, 3)}</p>
                    <TrendIcon trend={r?.nh3Trend} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">NH3</p>
                </div>
                <div>
                  <div className="flex items-center justify-center text-blue-500"><Wind className="h-4 w-4" /></div>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    <p className="text-base font-bold">{fmt(r?.o2, 1)}</p>
                    <TrendIcon trend={r?.o2Trend} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">O2</p>
                </div>
              </div>

              {lastMeasure && (
                <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-cyan-100 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {data?.source === 'stored' ? 'Ultima misura' : 'Aggiornato'}: {lastMeasure}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
