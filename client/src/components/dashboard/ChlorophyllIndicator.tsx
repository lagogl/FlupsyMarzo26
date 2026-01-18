import { useQuery } from '@tanstack/react-query';
import { Waves, TrendingUp, TrendingDown, Minus, Thermometer, Wind, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarineData {
  chl: number;
  sst: number;
  salinity: number;
  waveHeight?: number;
  trend: 'up' | 'down' | 'stable';
  quality: 'ottima' | 'buona' | 'media' | 'scarsa';
  history: number[];
  recordedAt: string;
  sourceUrl: string;
}

const getQualityColor = (quality: string) => {
  switch (quality) {
    case 'ottima': return 'text-green-600';
    case 'buona': return 'text-blue-600';
    case 'media': return 'text-yellow-600';
    case 'scarsa': return 'text-red-600';
    default: return 'text-gray-600';
  }
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
  const { data, isLoading } = useQuery<{ success: boolean; data: MarineData }>({
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
        <span>Dati mare...</span>
      </div>
    );
  }

  if (!data?.success || !data?.data) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Waves className="w-3 h-3" />
        <span>N/D</span>
      </div>
    );
  }

  const { chl, sst, salinity, trend, quality, history, recordedAt, sourceUrl } = data.data;
  const trendColor = trend === 'up' ? '#ef4444' : trend === 'down' ? '#22c55e' : '#6b7280';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={handleClick}
          >
            <div className="flex items-center gap-1">
              <Waves className={`w-3.5 h-3.5 ${getQualityColor(quality)}`} />
              <span className="text-[10px] text-gray-500">Chl-a</span>
              <span className={`text-xs font-bold ${getQualityColor(quality)}`}>{chl}</span>
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-red-500" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-green-500" />}
              {trend === 'stable' && <Minus className="w-3 h-3 text-gray-400" />}
              <MiniSparkline data={history} color={trendColor} />
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-medium">{sst.toFixed(1)}°C</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-500" />
              <span className="text-xs font-medium">{salinity.toFixed(1)}‰</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-3">
          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Dati Mare - Delta Po/Adriatico</p>
              <ExternalLink className="w-3 h-3 text-blue-500" />
            </div>
            <div className="grid grid-cols-3 gap-3 py-2 border-y border-gray-100">
              <div className="text-center">
                <p className="text-gray-500">Clorofilla-a</p>
                <p className={`font-bold text-lg ${getQualityColor(quality)}`}>{chl} <span className="text-xs font-normal">µg/L</span></p>
                <p className="text-[10px] text-gray-400 capitalize">Qualità: {quality}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Temperatura</p>
                <p className="font-bold text-lg text-orange-600">{sst.toFixed(1)}°C</p>
                <p className="text-[10px] text-gray-400">Superficie</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Salinità</p>
                <p className="font-bold text-lg text-cyan-600">{salinity.toFixed(1)}‰</p>
                <p className="text-[10px] text-gray-400">PSU</p>
              </div>
            </div>
            <p className="text-gray-500">
              Clorofilla-a indica produttività fitoplanctonica. Valori bassi = oligotrofia, alti = possibile bloom.
            </p>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Rilevato: {new Date(recordedAt).toLocaleString('it-IT')}</span>
              <span className="text-blue-500">Clicca per fonte dati ↗</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
