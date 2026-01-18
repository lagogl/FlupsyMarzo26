import { useQuery } from '@tanstack/react-query';
import { Waves, Thermometer, Droplets, ExternalLink, AlertCircle, Leaf } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarineData {
  sst: number | null;
  waveHeight: number | null;
  wavePeriod: number | null;
  chl: number | null;
  salinity: number | null;
  history: number[];
  recordedAt: string;
  sourceUrl: string;
  source: string;
  note?: string;
  isRealData: boolean;
}

const getChlorophyllQuality = (chl: number | null) => {
  if (chl === null) return { label: 'N/D', color: 'text-gray-400' };
  if (chl < 2) return { label: 'ottima', color: 'text-green-600' };
  if (chl < 5) return { label: 'buona', color: 'text-blue-600' };
  if (chl < 10) return { label: 'media', color: 'text-yellow-600' };
  return { label: 'alta', color: 'text-red-600' };
};

const MiniSparkline = ({ data, color = '#3b82f6' }: { data: number[], color?: string }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 16;
  const width = 40;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="inline-block ml-1">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function ChlorophyllIndicator() {
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: MarineData }>({
    queryKey: ['/api/marine-data/latest'],
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const handleClick = () => {
    if (data?.data?.sourceUrl) {
      window.open(data.data.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Waves className="w-3 h-3 animate-pulse" />
        <span>Copernicus...</span>
      </div>
    );
  }

  if (isError || !data?.success || !data?.data) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-400">
        <AlertCircle className="w-3 h-3" />
        <span>Copernicus non disponibile</span>
      </div>
    );
  }

  const marineData = data.data;
  const sst = marineData.sst ?? null;
  const waveHeight = marineData.waveHeight ?? null;
  const chl = marineData.chl ?? null;
  const salinity = marineData.salinity ?? null;
  const history = marineData.history ?? [];
  const source = marineData.source ?? 'unknown';
  const chlQuality = getChlorophyllQuality(chl);
  const isCopernicus = source === 'copernicus-marine';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={handleClick}
          >
            {chl !== null && (
              <>
                <div className="flex items-center gap-1">
                  <Leaf className={`w-3.5 h-3.5 ${chlQuality.color}`} />
                  <span className="text-[10px] text-gray-500">Chl-a</span>
                  <span className={`text-xs font-bold ${chlQuality.color}`}>{chl.toFixed(2)}</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
              </>
            )}
            <div className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] text-gray-500">SST</span>
              <span className="text-xs font-bold text-orange-600">{sst !== null ? `${sst.toFixed(1)}°C` : 'N/D'}</span>
              {history && history.length > 1 && <MiniSparkline data={history} color="#f97316" />}
            </div>
            {salinity !== null && (
              <>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-500" />
                  <span className="text-xs font-medium">{salinity.toFixed(1)}‰</span>
                </div>
              </>
            )}
            {waveHeight !== null && (
              <>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-1">
                  <Waves className="w-3 h-3 text-blue-500" />
                  <span className="text-xs font-medium">{waveHeight.toFixed(2)}m</span>
                </div>
              </>
            )}
            <div 
              className={`w-1.5 h-1.5 rounded-full ${isCopernicus ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} 
              title={isCopernicus ? 'Dati Copernicus' : 'Dati parziali'} 
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-3">
          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Copernicus Marine - Delta Po</p>
              <ExternalLink className="w-3 h-3 text-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3 py-2 border-y border-gray-100">
              <div className="text-center">
                <p className="text-gray-500">Clorofilla-a</p>
                <p className={`font-bold text-lg ${chlQuality.color}`}>
                  {chl !== null ? chl.toFixed(2) : 'N/D'} 
                  <span className="text-xs font-normal"> µg/L</span>
                </p>
                <p className="text-[10px] text-gray-400 capitalize">Qualità: {chlQuality.label}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Temperatura</p>
                <p className="font-bold text-lg text-orange-600">
                  {sst !== null ? `${sst.toFixed(1)}°C` : 'N/D'}
                </p>
                <p className="text-[10px] text-gray-400">Superficie</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Salinità</p>
                <p className="font-bold text-lg text-cyan-600">
                  {salinity !== null ? `${salinity.toFixed(1)}‰` : 'N/D'}
                </p>
                <p className="text-[10px] text-gray-400">PSU</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Onde</p>
                <p className="font-bold text-lg text-blue-600">
                  {waveHeight !== null ? `${waveHeight.toFixed(2)}m` : 'N/D'}
                </p>
                <p className="text-[10px] text-gray-400">Altezza</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 ${isCopernicus ? 'text-green-600' : 'text-yellow-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isCopernicus ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="font-medium">
                {isCopernicus ? 'Dati reali Copernicus Marine' : 'Dati parziali'}
              </span>
            </div>
            <p className="text-gray-500">
              {isCopernicus 
                ? 'Dati satellitari ufficiali da Copernicus Marine Data Store per Mediterraneo Nord.' 
                : 'Verifica le credenziali Copernicus per dati completi.'}
            </p>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Fonte: {source}</span>
              <span className="text-blue-500">Clicca per Copernicus Marine ↗</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
