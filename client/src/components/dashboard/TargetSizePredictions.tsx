import { useState } from "react";
import { getQueryFn } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2Icon, AlertCircleIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";
import * as ExcelJS from 'exceljs';

interface TargetSizePrediction {
  id: number;
  basketId: number;
  targetSizeId: number;
  status: string;
  predictedDate: string;
  basket: {
    id: number;
    physicalNumber: number;
    flupsyId: number;
    row: string | null;
    position: number | null;
  };
  lastOperation?: {
    id: number;
    date: string;
    animalsPerKg: number | null;
    averageWeight: number | null;
    animalCount?: number | null;
  } | null;
  daysRemaining: number;
  currentWeight?: number;
  targetWeight?: number;
  actualSize?: Size;
  requestedSize?: Size;
  animalCount?: number;
}

interface Flupsy {
  id: number;
  name: string;
}

interface Size {
  id: number;
  code: string;
  name: string;
  minAnimalsPerKg?: number;
  maxAnimalsPerKg?: number;
}

export function TargetSizePredictions() {
  const [days, setDays] = useState(14);
  const [targetSize, setTargetSize] = useState("TP-3000");
  
  const { data: sizes } = useQuery({
    queryKey: ['/api/sizes'],
    queryFn: getQueryFn<Size[]>({ on401: "throw" }),
  });
  
  const { data: flupsys } = useQuery({
    queryKey: ['/api/flupsys'],
    queryFn: getQueryFn<Flupsy[]>({ on401: "throw" }),
  });
  
  const flupsyNameMap = flupsys?.reduce((acc, f) => {
    acc[f.id] = f.name;
    return acc;
  }, {} as Record<number, string>) || {};
  
  const { data: predictions, isLoading, isError } = useQuery({
    queryKey: [`/api/size-predictions?size=${targetSize}&days=${days}`, targetSize, days],
    queryFn: getQueryFn<TargetSizePrediction[]>({ on401: "throw" }),
  });
  
  const totalAnimals = predictions?.reduce((sum, p) => {
    const count = p.animalCount || p.lastOperation?.animalCount || 0;
    return sum + count;
  }, 0) || 0;

  const totalBaskets = predictions?.length || 0;

  const avgWeight = predictions && predictions.length > 0
    ? Math.round(predictions.reduce((sum, p) => sum + (p.currentWeight || 0), 0) / predictions.length)
    : 0;

  const formatDateIT = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: it });
    } catch {
      return dateStr;
    }
  };

  const getBadgeStyle = (daysRemaining: number) => {
    if (daysRemaining <= 3) return "bg-red-500 hover:bg-red-600";
    if (daysRemaining <= 7) return "bg-amber-500 hover:bg-amber-600";
    return "bg-emerald-500 hover:bg-emerald-600";
  };
  
  const getDaysMessage = (daysRemaining: number) => {
    if (daysRemaining === 0) return "Oggi";
    if (daysRemaining === 1) return "Domani";
    return `Tra ${daysRemaining} giorni`;
  };

  const exportToExcel = async () => {
    if (!predictions || predictions.length === 0) return;

    const ExcelModule = (ExcelJS as any).default || ExcelJS;
    const workbook = new ExcelModule.Workbook();
    const ws = workbook.addWorksheet('Ceste in Arrivo');

    const titleRow = ws.addRow([`Ceste in arrivo a ${targetSize} - Prossimi ${days} giorni - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`]);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    ws.mergeCells(1, 1, 1, 11);
    titleRow.alignment = { horizontal: 'center' };

    const headers = ['Cesta', 'FLUPSY', 'Posizione', 'Animali', 'An/kg', 'Peso Medio (mg)', 'Attuale (mg)', 'Target (mg)', 'Incremento %', 'Data Arrivo', 'Giorni'];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    headerRow.alignment = { horizontal: 'center' };
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 11 } };

    ws.columns = [
      { width: 10 }, { width: 15 }, { width: 12 }, { width: 14 },
      { width: 12 }, { width: 16 }, { width: 14 }, { width: 14 },
      { width: 14 }, { width: 14 }, { width: 12 }
    ];

    predictions.forEach((p, idx) => {
      const animalCount = p.animalCount || p.lastOperation?.animalCount || 0;
      const animalsPerKg = p.lastOperation?.animalsPerKg || 0;
      const avgWt = p.lastOperation?.averageWeight || 0;
      const currentWt = p.currentWeight || 0;
      const targetWt = p.targetWeight || 0;
      const increment = currentWt > 0 ? Math.round((targetWt / currentWt - 1) * 100) : 0;
      const position = p.basket.row && p.basket.position ? `${p.basket.row}-${p.basket.position}` : '';

      const row = ws.addRow([
        p.basket.physicalNumber,
        flupsyNameMap[p.basket.flupsyId] || '',
        position,
        animalCount,
        animalsPerKg,
        Math.round(avgWt),
        Math.round(currentWt),
        Math.round(targetWt),
        increment,
        formatDateIT(p.predictedDate),
        p.daysRemaining
      ]);

      if (idx % 2 === 1) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      }
      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '#,##0';
      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).numFmt = '#,##0';
      row.getCell(9).numFmt = '0"%"';
    });

    const totalsRow = ws.addRow(['TOTALE', '', '', totalAnimals, '', '', '', '', '', `${totalBaskets} ceste`, '']);
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    totalsRow.getCell(4).numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ceste-Arrivo-${targetSize}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {totalAnimals > 0 && (
              <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-4 py-2">
                <span className="text-3xl font-bold text-primary">
                  {totalAnimals.toLocaleString('it-IT')}
                </span>
                <span className="text-xs text-muted-foreground">animali totali</span>
              </div>
            )}
            <div>
              <CardTitle className="text-xl font-bold">Ceste in arrivo a {targetSize}</CardTitle>
              <CardDescription>
                Previsioni di crescita verso la taglia commerciale {targetSize} 
                {days === 14 ? " (prossime 2 settimane)" : ` (prossimi ${days} giorni)`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-40">
              <Select value={targetSize} onValueChange={setTargetSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Taglia target" />
                </SelectTrigger>
                <SelectContent>
                  {sizes?.map(size => (
                    <SelectItem key={size.id} value={size.code}>
                      {size.code} - {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-x-2">
              {[7, 14, 30, 90].map(d => (
                <Button 
                  key={d}
                  variant={days === d ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setDays(d)}
                >
                  {d} giorni
                </Button>
              ))}
            </div>

            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={exportToExcel}
              disabled={!predictions || predictions.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center p-8 text-red-500">
            <AlertCircleIcon className="mr-2" />
            Errore nel caricamento delle previsioni
          </div>
        ) : predictions?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <CheckCircle2Icon size={48} className="mb-2 text-emerald-500" />
            <p className="text-center">Nessuna cesta raggiungerà la taglia {targetSize} nei prossimi {days} giorni</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-3 py-2 font-semibold">Cesta</th>
                  <th className="px-3 py-2 font-semibold">FLUPSY</th>
                  <th className="px-3 py-2 font-semibold text-right">Animali</th>
                  <th className="px-3 py-2 font-semibold text-right">An/kg</th>
                  <th className="px-3 py-2 font-semibold text-right">Peso Medio</th>
                  <th className="px-3 py-2 font-semibold text-right">Attuale</th>
                  <th className="px-3 py-2 font-semibold text-right">Target</th>
                  <th className="px-3 py-2 font-semibold text-right">Incr. %</th>
                  <th className="px-3 py-2 font-semibold">Data Arrivo</th>
                  <th className="px-3 py-2 font-semibold text-center">Stato</th>
                </tr>
              </thead>
              <tbody>
                {predictions?.map((p, idx) => {
                  const animalCount = p.animalCount || p.lastOperation?.animalCount || 0;
                  const animalsPerKg = p.lastOperation?.animalsPerKg || 0;
                  const avgWt = p.lastOperation?.averageWeight || 0;
                  const currentWt = p.currentWeight || 0;
                  const targetWt = p.targetWeight || 0;
                  const increment = currentWt > 0 ? Math.round((targetWt / currentWt - 1) * 100) : 0;

                  return (
                    <tr key={p.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-3 py-2">
                        <Link to={`/operazioni/cestello/${p.basketId}`}>
                          <span className="font-medium text-blue-600 hover:underline">#{p.basket.physicalNumber}</span>
                        </Link>
                        {p.basket.row && p.basket.position && (
                          <span className="ml-1 text-xs text-gray-500">{p.basket.row}-{p.basket.position}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{flupsyNameMap[p.basket.flupsyId] || '-'}</td>
                      <td className="px-3 py-2 text-right font-medium">{animalCount.toLocaleString('it-IT')}</td>
                      <td className="px-3 py-2 text-right">{animalsPerKg.toLocaleString('it-IT')}</td>
                      <td className="px-3 py-2 text-right">{Math.round(avgWt).toLocaleString('it-IT')} mg</td>
                      <td className="px-3 py-2 text-right">{Math.round(currentWt).toLocaleString('it-IT')} mg</td>
                      <td className="px-3 py-2 text-right">{Math.round(targetWt).toLocaleString('it-IT')} mg</td>
                      <td className="px-3 py-2 text-right">
                        <span className={increment > 50 ? 'text-amber-600' : increment > 20 ? 'text-blue-600' : 'text-green-600'}>
                          {increment}%
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatDateIT(p.predictedDate)}</td>
                      <td className="px-3 py-2 text-center">
                        <Badge className={`text-xs ${getBadgeStyle(p.daysRemaining)}`}>
                          {getDaysMessage(p.daysRemaining)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-semibold">
                  <td className="px-3 py-2">TOTALE</td>
                  <td className="px-3 py-2">{totalBaskets} ceste</td>
                  <td className="px-3 py-2 text-right">{totalAnimals.toLocaleString('it-IT')}</td>
                  <td className="px-3 py-2 text-right">-</td>
                  <td className="px-3 py-2 text-right">{avgWeight.toLocaleString('it-IT')} mg</td>
                  <td className="px-3 py-2" colSpan={5}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
