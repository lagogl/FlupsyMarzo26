import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Waves, Thermometer, Droplets, ExternalLink, AlertCircle, Leaf, TrendingUp, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface LocationData {
  locationName: string;
  sst: number | null;
  chlorophyll: number | null;
  salinity: number | null;
  waveHeight: number | null;
}

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
  locations?: LocationData[];
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

interface HistoryRecord {
  date: string;
  sst: number | null;
  chlorophyll: number | null;
  salinity: number | null;
  waveHeight: number | null;
}

interface HistoryData {
  success: boolean;
  data: Record<string, HistoryRecord[]>;
}

export default function ChlorophyllIndicator() {
  const [showHistory, setShowHistory] = useState(false);
  const [historyDays, setHistoryDays] = useState('30');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: MarineData }>({
    queryKey: ['/api/marine-data/latest'],
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery<HistoryData>({
    queryKey: ['/api/marine-data/history-by-location', historyDays],
    queryFn: async () => {
      const res = await fetch(`/api/marine-data/history-by-location?days=${historyDays}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    },
    enabled: showHistory,
    staleTime: 1000 * 60 * 5,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowHistory(true);
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
  const locations = marineData.locations ?? [];
  const chlQuality = getChlorophyllQuality(chl);
  const isCopernicus = source.includes('copernicus') || (chl !== null && salinity !== null);

  const LocationBadge = ({ loc, short }: { loc: LocationData; short: string }) => {
    const locChlQuality = getChlorophyllQuality(loc.chlorophyll);
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-slate-200">
        <span className="text-[9px] font-semibold text-gray-500 bg-slate-100 px-1 rounded">{short}</span>
        <Thermometer className="w-3 h-3 text-orange-500" />
        <span className="text-xs font-bold text-orange-600">{loc.sst?.toFixed(1) ?? 'N/D'}°</span>
        <Leaf className={`w-3 h-3 ${locChlQuality.color}`} />
        <span className={`text-xs font-bold ${locChlQuality.color}`}>{loc.chlorophyll?.toFixed(2) ?? 'N/D'}</span>
        <Droplets className="w-3 h-3 text-cyan-500" />
        <span className="text-xs font-bold text-cyan-600">{loc.salinity?.toFixed(1) ?? 'N/D'}‰</span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={handleClick}
          >
            {locations.length > 0 ? (
              <>
                {locations.map((loc, idx) => (
                  <LocationBadge 
                    key={idx} 
                    loc={loc} 
                    short={loc.locationName === "Ca' Pisani" ? "CP" : "DF"} 
                  />
                ))}
              </>
            ) : (
              <>
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
        <TooltipContent side="bottom" className="max-w-md p-3">
          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Dati Marini Copernicus</p>
              <ExternalLink className="w-3 h-3 text-blue-500" />
            </div>
            
            {locations.length > 0 ? (
              <div className="space-y-3 py-2 border-y border-gray-100">
                {locations.map((loc, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="font-semibold text-gray-700 text-xs border-b border-gray-100 pb-1">
                      📍 {loc.locationName}
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-gray-400">SST</p>
                        <p className="font-bold text-orange-600">
                          {loc.sst !== null ? `${loc.sst.toFixed(1)}°C` : 'N/D'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Chl-a</p>
                        <p className={`font-bold ${getChlorophyllQuality(loc.chlorophyll).color}`}>
                          {loc.chlorophyll !== null ? loc.chlorophyll.toFixed(2) : 'N/D'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Salinità</p>
                        <p className="font-bold text-cyan-600">
                          {loc.salinity !== null ? `${loc.salinity.toFixed(1)}‰` : 'N/D'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Onde</p>
                        <p className="font-bold text-blue-600">
                          {loc.waveHeight !== null ? `${loc.waveHeight.toFixed(2)}m` : 'N/D'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 py-2 border-y border-gray-100">
                <div className="text-center">
                  <p className="text-gray-500">Clorofilla-a</p>
                  <p className={`font-bold text-lg ${chlQuality.color}`}>
                    {chl !== null ? chl.toFixed(2) : 'N/D'} 
                    <span className="text-xs font-normal"> µg/L</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Temperatura</p>
                  <p className="font-bold text-lg text-orange-600">
                    {sst !== null ? `${sst.toFixed(1)}°C` : 'N/D'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Salinità</p>
                  <p className="font-bold text-lg text-cyan-600">
                    {salinity !== null ? `${salinity.toFixed(1)}‰` : 'N/D'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Onde</p>
                  <p className="font-bold text-lg text-blue-600">
                    {waveHeight !== null ? `${waveHeight.toFixed(2)}m` : 'N/D'}
                  </p>
                </div>
              </div>
            )}
            
            <div className={`flex items-center gap-1 ${isCopernicus ? 'text-green-600' : 'text-yellow-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isCopernicus ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="font-medium">
                {isCopernicus ? 'Dati reali Copernicus Marine' : 'Dati parziali'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Fonte: {source}</span>
              <span className="text-blue-500">Clicca per grafici storici ↗</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Storico Dati Ambientali
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={historyDays} onValueChange={setHistoryDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 giorni</SelectItem>
                  <SelectItem value="14">14 giorni</SelectItem>
                  <SelectItem value="30">30 giorni</SelectItem>
                  <SelectItem value="60">60 giorni</SelectItem>
                  <SelectItem value="90">90 giorni</SelectItem>
                  <SelectItem value="180">6 mesi</SelectItem>
                  <SelectItem value="365">1 anno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sito:</span>
              <Select value={selectedLocation || 'all'} onValueChange={(v) => setSelectedLocation(v === 'all' ? null : v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i siti</SelectItem>
                  <SelectItem value="Ca' Pisani">Ca' Pisani (CP)</SelectItem>
                  <SelectItem value="Delta Futuro">Delta Futuro (DF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-500">Caricamento dati storici...</span>
            </div>
          ) : historyData?.success && historyData.data ? (
            <Tabs defaultValue="sst" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sst">Temperatura (SST)</TabsTrigger>
                <TabsTrigger value="chlorophyll">Clorofilla-a</TabsTrigger>
                <TabsTrigger value="salinity">Salinità</TabsTrigger>
              </TabsList>

              {['sst', 'chlorophyll', 'salinity'].map((metric) => {
                const locationNames = Object.keys(historyData.data);
                const filteredLocations = selectedLocation 
                  ? locationNames.filter(l => l === selectedLocation)
                  : locationNames;
                
                const chartData: any[] = [];
                const allDates = new Set<string>();
                
                filteredLocations.forEach(loc => {
                  historyData.data[loc].forEach(record => {
                    const dateStr = new Date(record.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
                    allDates.add(dateStr);
                  });
                });

                Array.from(allDates).sort().forEach(dateStr => {
                  const point: any = { date: dateStr };
                  filteredLocations.forEach(loc => {
                    const record = historyData.data[loc].find(r => 
                      new Date(r.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) === dateStr
                    );
                    if (record) {
                      point[loc] = metric === 'sst' ? record.sst : metric === 'chlorophyll' ? record.chlorophyll : record.salinity;
                    }
                  });
                  chartData.push(point);
                });

                const colors: Record<string, string> = {
                  "Ca' Pisani": '#3b82f6',
                  "Delta Futuro": '#10b981'
                };

                const units: Record<string, string> = {
                  sst: '°C',
                  chlorophyll: 'µg/L',
                  salinity: '‰'
                };

                const titles: Record<string, string> = {
                  sst: 'Temperatura Superficiale del Mare',
                  chlorophyll: 'Concentrazione Clorofilla-a',
                  salinity: 'Salinità'
                };

                return (
                  <TabsContent key={metric} value={metric} className="mt-4">
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-700">{titles[metric]}</h3>
                      <p className="text-xs text-gray-500">Ultimi {historyDays} giorni - {chartData.length} rilevazioni</p>
                    </div>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" unit={units[metric]} />
                          <RechartsTooltip 
                            contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            formatter={(value: number) => [value?.toFixed(2) + ' ' + units[metric], '']}
                          />
                          <Legend />
                          {filteredLocations.map(loc => (
                            <Line 
                              key={loc}
                              type="monotone" 
                              dataKey={loc} 
                              stroke={colors[loc] || '#6b7280'} 
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name={loc}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Nessun dato disponibile per il periodo selezionato
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nessun dato storico disponibile
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xs text-gray-400">Fonte: Copernicus Marine Data Store</span>
            <button 
              onClick={() => data?.data?.sourceUrl && window.open(data.data.sourceUrl, '_blank')}
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Apri Copernicus Marine
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
