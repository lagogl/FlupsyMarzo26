import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Waves, Thermometer, Droplets, FlaskConical, Wind, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CurrentResponse {
  source: 'live' | 'stored';
  reading: {
    deviceName: string;
    temperature: number | null;
    ph: number | null;
    nh3: number | null;
    o2: number | null;
    recordDate?: string;
  };
}

function fmt(v: number | null | undefined, d = 2): string {
  if (v === null || v === undefined) return '-';
  return v.toFixed(d);
}

export default function SeneyeCard() {
  const { data, isLoading } = useQuery<CurrentResponse>({
    queryKey: ['/api/seneye/current'],
    refetchInterval: 5 * 60 * 1000,
  });

  const r = data?.reading;

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
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center text-red-500"><Thermometer className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(r?.temperature, 1)}</p>
                <p className="text-[10px] text-muted-foreground">°C</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-purple-500"><Droplets className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(r?.ph, 2)}</p>
                <p className="text-[10px] text-muted-foreground">pH</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-yellow-600"><FlaskConical className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(r?.nh3, 3)}</p>
                <p className="text-[10px] text-muted-foreground">NH3</p>
              </div>
              <div>
                <div className="flex items-center justify-center text-blue-500"><Wind className="h-4 w-4" /></div>
                <p className="text-base font-bold mt-0.5">{fmt(r?.o2, 1)}</p>
                <p className="text-[10px] text-muted-foreground">O2</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
