import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DistributionData {
  success: boolean;
  animalsBySize: Array<{
    sizeCode: string;
    color: string | null;
    basketCount: number;
    totalAnimals: number;
  }>;
  mortalityBySize: Array<{
    sizeCode: string;
    basketCount: number;
    avgMortality: number;
  }>;
}

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#0ea5e9', '#eab308', '#d946ef'
];

const MORTALITY_COLORS = [
  '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', 
  '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'
];

export default function SizeDistributionPopup() {
  const { data, isLoading } = useQuery<DistributionData>({
    queryKey: ['/api/stats/distribution-by-size'],
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="p-4 min-w-[500px]">
        <div className="animate-pulse flex space-x-4">
          <div className="h-48 w-48 bg-gray-200 rounded-full"></div>
          <div className="h-48 w-48 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!data?.success) {
    return <div className="p-4 text-gray-500">Errore caricamento dati</div>;
  }

  const animalsData = data.animalsBySize
    .filter(d => d.totalAnimals > 0)
    .sort((a, b) => b.totalAnimals - a.totalAnimals)
    .map((d, i) => ({
      name: d.sizeCode,
      value: d.totalAnimals,
      basketCount: d.basketCount,
      color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
    }));

  const mortalityData = data.mortalityBySize
    .filter(d => d.avgMortality > 0)
    .sort((a, b) => b.avgMortality - a.avgMortality)
    .map((d, i) => ({
      name: d.sizeCode,
      value: Math.round(d.avgMortality * 100) / 100,
      basketCount: d.basketCount,
      color: MORTALITY_COLORS[Math.min(Math.floor(d.avgMortality / 10), MORTALITY_COLORS.length - 1)]
    }));

  const totalAnimals = animalsData.reduce((sum, d) => sum + d.value, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const CustomTooltipAnimals = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalAnimals) * 100).toFixed(1);
      return (
        <div className="bg-white p-2 shadow-lg rounded border text-sm">
          <p className="font-semibold">{data.name}</p>
          <p>{formatNumber(data.value)} animali ({percentage}%)</p>
          <p className="text-gray-500">{data.basketCount} ceste</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipMortality = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 shadow-lg rounded border text-sm">
          <p className="font-semibold">{data.name}</p>
          <p>{data.value.toFixed(1)}% mortalità media</p>
          <p className="text-gray-500">{data.basketCount} ceste con mortalità</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 min-w-[600px] max-w-[700px] bg-white rounded-lg shadow-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">
            Distribuzione Animali per Taglia
          </h3>
          <p className="text-xs text-gray-500 text-center mb-2">
            Totale: {formatNumber(totalAnimals)} animali
          </p>
          {animalsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={animalsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {animalsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipAnimals />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              Nessun dato disponibile
            </div>
          )}
          <div className="mt-2 max-h-[100px] overflow-y-auto">
            <div className="flex flex-wrap gap-1 justify-center">
              {animalsData.slice(0, 8).map((d, i) => (
                <div key={i} className="flex items-center text-[10px]">
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: d.color }}
                  />
                  <span>{d.name}: {formatNumber(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">
            Mortalità Media per Taglia
          </h3>
          <p className="text-xs text-gray-500 text-center mb-2">
            Ceste con mortalità registrata
          </p>
          {mortalityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mortalityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value.toFixed(0)}%`}
                  labelLine={false}
                >
                  {mortalityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipMortality />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              Nessuna mortalità registrata
            </div>
          )}
          <div className="mt-2 max-h-[100px] overflow-y-auto">
            <div className="flex flex-wrap gap-1 justify-center">
              {mortalityData.slice(0, 8).map((d, i) => (
                <div key={i} className="flex items-center text-[10px]">
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: d.color }}
                  />
                  <span>{d.name}: {d.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
