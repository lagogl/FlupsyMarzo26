import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Gauge, ArrowRight } from 'lucide-react';

type IMMInventoryResponse = {
  success: boolean;
  data: {
    config: { targetSizeCode: string; horizonDays: number };
    totals: { totalAnimals: number; totalCycles: number; immGlobal: number };
    distribution: Array<{ range: string; animalCount: number; pctOfTotal: number }>;
  };
};

function immColor(imm: number): string {
  if (imm >= 75) return 'text-green-600';
  if (imm >= 50) return 'text-lime-600';
  if (imm >= 25) return 'text-amber-600';
  return 'text-red-600';
}

function immBg(imm: number): string {
  if (imm >= 75) return 'from-green-50 to-green-100 border-l-4 border-green-500';
  if (imm >= 50) return 'from-lime-50 to-lime-100 border-l-4 border-lime-500';
  if (imm >= 25) return 'from-amber-50 to-amber-100 border-l-4 border-amber-500';
  return 'from-red-50 to-red-100 border-l-4 border-red-500';
}

export default function IMMCard() {
  const { data, isLoading } = useQuery<IMMInventoryResponse>({
    queryKey: ['/api/imm/inventory'],
    staleTime: 5 * 60 * 1000,
  });

  const imm = data?.data?.totals?.immGlobal ?? 0;
  const totalAnimals = data?.data?.totals?.totalAnimals ?? 0;
  const totalCycles = data?.data?.totals?.totalCycles ?? 0;
  const target = data?.data?.config?.targetSizeCode ?? 'TP-3000';
  const dist = data?.data?.distribution ?? [];
  const pronti = dist.find((d) => d.range.startsWith('75'))?.pctOfTotal ?? 0;
  const maturi = dist.find((d) => d.range.startsWith('50'))?.pctOfTotal ?? 0;

  return (
    <Link href="/imm">
      <div
        className={`bg-gradient-to-br ${immBg(imm)} rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-white/60 flex items-center justify-center">
              <Gauge className={`h-7 w-7 ${immColor(imm)}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">IMM Magazzino</p>
              <p className="text-xs text-gray-500">Target: {target}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className={`text-4xl font-bold ${immColor(imm)}`}>
            {isLoading ? '…' : imm.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>

        <div className="mt-2 space-y-1 text-xs text-gray-700">
          <div className="flex justify-between">
            <span>Pronti vendita (≥75)</span>
            <span className="font-semibold text-green-700">{pronti}%</span>
          </div>
          <div className="flex justify-between">
            <span>Maturi (50–75)</span>
            <span className="font-semibold text-lime-700">{maturi}%</span>
          </div>
          <div className="flex justify-between text-gray-500 pt-1 border-t border-white/40">
            <span>{totalCycles} cicli attivi</span>
            <span>{totalAnimals.toLocaleString('it-IT')} animali</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
