import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Package, Search, ArrowLeft, AlertCircle, TrendingDown, TrendingUp,
  Activity, Boxes, Skull, ShoppingCart, GitMerge, GitBranch,
  Calendar, MapPin, Hash, Layers, ChevronRight, Info,
} from 'lucide-react';

const fmt = (n: number) => Number.isFinite(n) ? new Intl.NumberFormat('it-IT').format(Math.round(n)) : '—';
const fmtPct = (n: number) => Number.isFinite(n) ? `${n.toFixed(1)}%` : '—';
const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; }
};

interface Lot {
  id: number;
  arrival_date: string;
  supplier: string;
  supplier_lot_number: string | null;
  animal_count: number;
  state: string;
  active_baskets: string | number;
}

function LotPicker() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useQuery<{ lots: Lot[] }>({ queryKey: ['/api/lot-report/list'] });
  const lots = data?.lots ?? [];
  const filtered = useMemo(() => {
    if (!filter.trim()) return lots;
    const q = filter.toLowerCase();
    return lots.filter(l =>
      String(l.id).includes(q) ||
      (l.supplier ?? '').toLowerCase().includes(q) ||
      (l.supplier_lot_number ?? '').toLowerCase().includes(q)
    );
  }, [lots, filter]);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Package className="w-6 h-6 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold">Report Lotto</h1>
          <p className="text-sm text-gray-500">Bilancio, distribuzione attuale e cronologia di un lotto</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            Seleziona un lotto
            <div className="relative ml-auto w-72">
              <Input
                placeholder="Cerca per ID, fornitore o n. lotto..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="h-8 pl-7 text-xs"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <div className="p-6 text-center text-gray-400">Caricamento...</div>}
          {!isLoading && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">ID</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Arrivo</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Fornitore</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">N° Lotto</th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-gray-600">Iniziali</th>
                  <th className="py-2 px-3 text-center text-xs font-semibold text-gray-600">Ceste attive</th>
                  <th className="py-2 px-3 text-center text-xs font-semibold text-gray-600">Stato</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}
                    className="border-b hover:bg-emerald-50/50 cursor-pointer"
                    onClick={() => navigate(`/report-lotto/${l.id}`)}
                  >
                    <td className="py-2 px-3 font-mono text-xs text-gray-500">#{l.id}</td>
                    <td className="py-2 px-3 text-xs">{fmtDate(l.arrival_date)}</td>
                    <td className="py-2 px-3 font-medium">{l.supplier}</td>
                    <td className="py-2 px-3 text-xs text-gray-500">{l.supplier_lot_number ?? '—'}</td>
                    <td className="py-2 px-3 text-right">{fmt(l.animal_count)}</td>
                    <td className="py-2 px-3 text-center">
                      {Number(l.active_baskets) > 0 ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-medium">
                          {l.active_baskets}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${l.state === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {l.state === 'active' ? 'Attivo' : 'Esaurito'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-600">
                      <ChevronRight className="w-4 h-4 inline" />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400 text-sm">Nessun lotto trovato</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ReportData {
  lot: any;
  bilancio: {
    initial: number;
    deaths: number; deathsPct: number;
    ledgerDeaths: number; ledgerDeathsPct: number;
    sales: number; salesPct: number;
    activeNow: number; activeNowPct: number;
    activeInPure: number; activeInMixed: number;
    transferOut: number; transferIn: number;
    residual: number; residualPct: number;
    survivalPct: number;
  };
  distribution: any[];
  timeline: any[];
}

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  in:           { label: 'Ingresso lotto',          color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Package },
  activation:   { label: 'Attivazione ciclo',       color: 'text-blue-700 bg-blue-50 border-blue-200',         icon: GitBranch },
  transfer_out: { label: 'Vagliatura — uscita',     color: 'text-amber-700 bg-amber-50 border-amber-200',      icon: GitMerge },
  transfer_in:  { label: 'Vagliatura — ingresso',   color: 'text-cyan-700 bg-cyan-50 border-cyan-200',         icon: GitMerge },
  sale:         { label: 'Vendita',                  color: 'text-green-700 bg-green-50 border-green-200',      icon: ShoppingCart },
  mortality:    { label: 'Mortalità',                color: 'text-red-700 bg-red-50 border-red-200',            icon: Skull },
};

function LotReportDetail({ lotId }: { lotId: number }) {
  const { data, isLoading, error } = useQuery<ReportData>({ queryKey: [`/api/lot-report/${lotId}`] });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Caricamento report lotto...</div>;
  if (error || !data) return (
    <div className="p-8 text-center text-red-600">
      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
      Errore nel caricamento del report
    </div>
  );

  const { lot, bilancio, distribution, timeline } = data;
  const balanced = Math.abs(bilancio.residualPct) < 1;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/report-lotto">
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowLeft className="w-4 h-4 mr-1" /> Cambia lotto
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-600" />
              Lotto #{lot.id} — {lot.supplier}
            </h1>
            <p className="text-sm text-gray-500">
              {lot.supplierLotNumber && <>N° fornitore <strong>{lot.supplierLotNumber}</strong> · </>}
              Arrivato il <strong>{fmtDate(lot.arrivalDate)}</strong> · Stato:{' '}
              <span className={lot.state === 'active' ? 'text-green-600 font-medium' : 'text-gray-500'}>
                {lot.state === 'active' ? 'Attivo' : 'Esaurito'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* === BILANCIO === */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" /> Bilancio del lotto
            {balanced ? (
              <span className="ml-auto text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                ✓ Quadrato
              </span>
            ) : bilancio.residualPct > 0 ? (
              <span className="ml-auto text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                ⚠ Mancano {fmtPct(bilancio.residualPct)} (residuo non spiegato)
              </span>
            ) : (
              <span className="ml-auto text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                ⓘ Eccedenza {fmtPct(Math.abs(bilancio.residualPct))} (animali in più rispetto agli iniziali)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Barra impilata 100% */}
          <div className="mb-3">
            <div className="flex h-6 rounded overflow-hidden border border-gray-200">
              {bilancio.deathsPct > 0.1 && (
                <div className="bg-red-400 flex items-center justify-center text-[10px] text-white font-medium"
                  style={{ width: `${bilancio.deathsPct}%` }} title={`Morti: ${fmt(bilancio.deaths)}`}>
                  {bilancio.deathsPct > 5 ? `${bilancio.deathsPct.toFixed(0)}%` : ''}
                </div>
              )}
              {bilancio.salesPct > 0.1 && (
                <div className="bg-green-500 flex items-center justify-center text-[10px] text-white font-medium"
                  style={{ width: `${bilancio.salesPct}%` }} title={`Venduti: ${fmt(bilancio.sales)}`}>
                  {bilancio.salesPct > 5 ? `${bilancio.salesPct.toFixed(0)}%` : ''}
                </div>
              )}
              {bilancio.activeNowPct > 0.1 && (
                <div className="bg-emerald-600 flex items-center justify-center text-[10px] text-white font-medium"
                  style={{ width: `${bilancio.activeNowPct}%` }} title={`Attivi: ${fmt(bilancio.activeNow)}`}>
                  {bilancio.activeNowPct > 5 ? `${bilancio.activeNowPct.toFixed(0)}%` : ''}
                </div>
              )}
              {Math.abs(bilancio.residualPct) > 0.1 && (
                <div className="bg-gray-300 flex items-center justify-center text-[10px] text-gray-700 font-medium"
                  style={{ width: `${Math.abs(bilancio.residualPct)}%` }} title={`Residuo: ${fmt(bilancio.residual)}`}>
                  {Math.abs(bilancio.residualPct) > 5 ? `${Math.abs(bilancio.residualPct).toFixed(0)}%` : ''}
                </div>
              )}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
              <span>0</span><span>100% degli animali iniziali</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Stat label="Iniziali" value={fmt(bilancio.initial)} sub="100%" color="text-gray-700" icon={Package} />
            <Stat
              label="Morti (totale)"
              value={fmt(bilancio.deaths)}
              sub={`${fmtPct(bilancio.deathsPct)}${bilancio.ledgerDeaths > 0 ? ` · ${fmt(bilancio.ledgerDeaths)} da campioni` : ''}`}
              color="text-red-600"
              icon={Skull}
            />
            <Stat label="Venduti" value={fmt(bilancio.sales)} sub={fmtPct(bilancio.salesPct)} color="text-green-600" icon={ShoppingCart} />
            <Stat label="Attivi (oggi)" value={fmt(bilancio.activeNow)} sub={fmtPct(bilancio.activeNowPct)} color="text-emerald-700" icon={Boxes} />
            <Stat label="Sopravvivenza" value={fmtPct(bilancio.survivalPct)} sub="(venduti+attivi)/iniziali" color="text-blue-700" icon={TrendingUp} />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-emerald-50 border border-emerald-100">
              <div className="text-gray-600">Attivi in cesti <strong>puri</strong></div>
              <div className="text-lg font-semibold text-emerald-800">{fmt(bilancio.activeInPure)}</div>
            </div>
            <div className="p-2 rounded bg-purple-50 border border-purple-100">
              <div className="text-gray-600 flex items-center gap-1">
                Attivi in cesti <strong>misti</strong> (pro-quota)
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <div className="text-lg font-semibold text-purple-800">{fmt(bilancio.activeInMixed)}</div>
            </div>
            <div className="p-2 rounded bg-gray-50 border border-gray-200">
              <div className="text-gray-600">Residuo (iniziali − morti − venduti − attivi)</div>
              <div className={`text-lg font-semibold ${balanced ? 'text-gray-400' : bilancio.residual >= 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                {bilancio.residual >= 0 ? '+' : ''}{fmt(bilancio.residual)}{' '}
                <span className="text-xs font-normal">({bilancio.residualPct >= 0 ? '+' : ''}{fmtPct(bilancio.residualPct)})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === DISTRIBUZIONE ATTUALE === */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-600" />
            Dove sono ora gli animali del lotto
            <span className="text-xs font-normal text-gray-400">
              ({distribution.length} {distribution.length === 1 ? 'cesta attiva' : 'ceste attive'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {distribution.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Nessuna cesta attiva contiene più animali di questo lotto.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Cesta</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">FLUPSY</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Tipo</th>
                  <th className="py-2 px-3 text-right font-semibold text-gray-600">Tot. animali</th>
                  <th className="py-2 px-3 text-right font-semibold text-gray-600">Quota lotto</th>
                  <th className="py-2 px-3 text-right font-semibold text-gray-600">Animali pro-quota</th>
                  <th className="py-2 px-3 text-center font-semibold text-gray-600">Taglia</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Ultima op.</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map(d => (
                  <tr key={`${d.basketId}-${d.cycleId}`} className="border-b hover:bg-blue-50/30">
                    <td className="py-2 px-3 font-medium">
                      <Hash className="w-3 h-3 inline text-gray-400 mr-0.5" />
                      {d.physicalNumber}
                      <span className="text-[10px] text-gray-400 ml-1">·C#{d.cycleId}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      <MapPin className="w-3 h-3 inline text-gray-400 mr-0.5" />
                      {d.flupsyName}
                    </td>
                    <td className="py-2 px-3">
                      {d.isMixed ? (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-medium">
                          <Layers className="w-3 h-3 inline mr-0.5" />
                          Misto ({d.lotsInBasket} lotti)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                          Puro
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-700">{fmt(d.lastTotalAnimals)}</td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-200 rounded overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, d.lotPercentage)}%` }} />
                        </div>
                        <span className="font-medium">{d.lotPercentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-700">{fmt(d.lotAnimals)}</td>
                    <td className="py-2 px-3 text-center">
                      {d.lastSizeCode ? (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono">
                          {d.lastSizeCode}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{fmtDate(d.lastOpDate)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td colSpan={5} className="py-2 px-3 text-right text-gray-600">Totale animali pro-quota:</td>
                  <td className="py-2 px-3 text-right text-emerald-800">{fmt(bilancio.activeNow)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

      {/* === TIMELINE === */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Cronologia eventi del lotto
            <span className="text-xs font-normal text-gray-400">({timeline.length} eventi)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Nessun evento registrato</div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-200" />
              {timeline.map((ev, idx) => {
                const meta = TYPE_META[ev.type] ?? { label: ev.type, color: 'text-gray-700 bg-gray-50 border-gray-200', icon: Activity };
                const Icon = meta.icon;
                const sign = ['mortality', 'sale', 'transfer_out'].includes(ev.type) ? '−' : '+';
                const qty = Math.abs(Number(ev.quantity));
                return (
                  <div key={ev.id} className="relative pb-3">
                    <div className={`absolute -left-[1.6rem] top-1 w-4 h-4 rounded-full border-2 border-white ring-1 ${meta.color.split(' ')[1]} flex items-center justify-center`}>
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <div className={`px-3 py-2 rounded border ${meta.color}`}>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-mono">{fmtDate(ev.date)}</span>
                        <span className="text-xs font-semibold">{meta.label}</span>
                        <span className="ml-auto text-sm font-bold">
                          {sign} {fmt(qty)} animali
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-0.5 flex flex-wrap gap-x-3">
                        {ev.basketPhysical && (
                          <span><Hash className="w-3 h-3 inline mr-0.5" />Cesta {ev.basketPhysical}{ev.flupsyName && ` · ${ev.flupsyName}`}</span>
                        )}
                        {ev.screeningNumber && (
                          <span><GitMerge className="w-3 h-3 inline mr-0.5" />Vagliatura #{ev.screeningNumber}</span>
                        )}
                        {ev.sourceCycleId && <span>da C#{ev.sourceCycleId}</span>}
                        {ev.destCycleId && <span>→ C#{ev.destCycleId}</span>}
                        {ev.allocationMethod === 'proportional' && (
                          <span className="text-purple-600">pro-quota</span>
                        )}
                        {ev.notes && <span className="italic text-gray-500">{ev.notes}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub, color, icon: Icon }: any) {
  return (
    <div className="p-2 rounded border border-gray-200 bg-white">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wide">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className={`text-lg font-bold mt-0.5 ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-400">{sub}</div>
    </div>
  );
}

export default function ReportLotto() {
  const [match, params] = useRoute<{ lotId: string }>('/report-lotto/:lotId');
  if (match && params?.lotId) {
    const lotId = parseInt(params.lotId);
    if (Number.isFinite(lotId)) return <LotReportDetail lotId={lotId} />;
  }
  return <LotPicker />;
}
