import { useState, useRef, useEffect } from 'react';
import { X, Move, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getSizeCodeFromAnimalsPerKg } from '@/lib/sizeUtils';

interface DraggableCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    sampleWeight: number;
    sampleCount: number;
    totalWeight: number;
    deadCount: number;
    animalCount: number;
    animalsPerKg: number;
    mortalityRate: number;
    position: number;
    screeningPosition: 'sopra' | 'sotto' | null;
    qualityNote: 'belli' | 'brutti' | null;
  }) => void;
  initialData?: {
    sampleWeight?: number;
    sampleCount?: number;
    totalWeight?: number;
    deadCount?: number;
    animalsPerKg?: number;
    position?: number;
    screeningPosition?: 'sopra' | 'sotto' | null;
    qualityNote?: 'belli' | 'brutti' | null;
  };
}

export default function DraggableCalculator({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialData = {} 
}: DraggableCalculatorProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Dati del calcolatore - state stringa per input decimali, numeri per il resto
  const [sampleWeightInput, setSampleWeightInput] = useState('');
  const [sampleCount, setSampleCount] = useState(0);
  const [totalWeightInput, setTotalWeightInput] = useState('');
  const [deadCount, setDeadCount] = useState(0);
  const [animalsPerKg, setAnimalsPerKg] = useState(initialData.animalsPerKg || 0);
  const [basketPosition, setBasketPosition] = useState(initialData.position || 1);
  
  // Note operative opzionali
  const [screeningPosition, setScreeningPosition] = useState<'sopra' | 'sotto' | null>(initialData.screeningPosition || null);
  const [qualityNote, setQualityNote] = useState<'belli' | 'brutti' | null>(initialData.qualityNote || null);
  
  const calculatorRef = useRef<HTMLDivElement>(null);
  
  // Helper per convertire input stringa in numero (accetta virgola e punto)
  const parseDecimalInput = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    // Sostituisce virgola con punto
    const normalized = value.replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  };
  
  // Converti input stringa in numeri per calcoli
  const sampleWeight = parseDecimalInput(sampleWeightInput);
  const totalWeight = parseDecimalInput(totalWeightInput);
  
  // Query per ottenere le taglie
  const { data: sizes = [] } = useQuery({
    queryKey: ['/api/sizes'],
    enabled: isOpen
  });
  
  // Calcoli automatici
  const totalSample = sampleCount + deadCount;
  const mortalityRate = totalSample > 0 ? parseFloat(((deadCount / totalSample) * 100).toFixed(1)) : 0;
  const mortalityFactor = 1 - (mortalityRate / 100);
  
  // Calcola animali per kg dal campione (peso campione in grammi / numero animali vivi * 1000)
  const calculatedAnimalsPerKg = sampleWeight > 0 && sampleCount > 0 
    ? Math.round((sampleCount / sampleWeight) * 1000) 
    : animalsPerKg;
  
  const theoreticalAnimals = totalWeight * calculatedAnimalsPerKg;
  const animalCount = Math.round(theoreticalAnimals * mortalityFactor);
  
  // Calcola la taglia in base agli animali per kg
  const calculatedSize = getSizeCodeFromAnimalsPerKg(calculatedAnimalsPerKg, sizes as any[]);
  
  // Gestione drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragStart.y));
      setPosition({ x: newX, y: newY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);
  
  const handleConfirm = () => {
    onConfirm({
      sampleWeight,
      sampleCount: Math.round(sampleCount),
      totalWeight,
      deadCount: Math.round(deadCount),
      animalCount: Math.round(animalCount),
      animalsPerKg: Math.round(calculatedAnimalsPerKg),
      mortalityRate,
      position: basketPosition,
      screeningPosition,
      qualityNote
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={calculatorRef}
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '200px' : '280px'
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="shadow-lg border-2 border-blue-200 bg-white">
        {/* Header draggable */}
        <div className="drag-handle flex items-center justify-between p-2 bg-blue-50 border-b cursor-move hover:bg-blue-100 transition-colors">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Calcolatore</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-200"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Move className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-200"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="p-3 space-y-3">
            {/* Grid compatto 2x3 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <Label className="text-xs text-green-700">Peso Campione (g)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={sampleWeightInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Accetta solo numeri, punto e virgola
                    if (value === '' || /^[0-9,.]*$/.test(value)) {
                      setSampleWeightInput(value);
                    }
                  }}
                  className="h-7 text-xs"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-blue-700">N° Animali Vivi</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={sampleCount || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setSampleCount(parseInt(value, 10) || 0);
                    }
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-orange-700">Peso Totale (kg)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={totalWeightInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Accetta solo numeri, punto e virgola
                    if (value === '' || /^[0-9,.]*$/.test(value)) {
                      setTotalWeightInput(value);
                    }
                  }}
                  className="h-7 text-xs"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-red-700">Animali Morti</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={deadCount || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setDeadCount(parseInt(value, 10) || 0);
                    }
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-purple-700">Animali/Kg</Label>
                <div className="h-7 px-2 py-1 border rounded text-xs bg-gray-50 text-gray-700 flex items-center">
                  {calculatedAnimalsPerKg.toLocaleString('it-IT')}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-700">Posizione</Label>
                <div className="h-7 px-2 py-1 border rounded text-xs bg-gray-50 text-gray-700 flex items-center">
                  {basketPosition}
                </div>
              </div>
            </div>
            
            {/* Taglia calcolata */}
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div>
                <Label className="text-xs text-indigo-700">Taglia</Label>
                <div className="h-7 px-2 py-1 border rounded text-xs bg-indigo-50 text-indigo-700 flex items-center font-medium">
                  {calculatedSize}
                </div>
              </div>
            </div>
            
            {/* Risultati compatti */}
            <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-blue-600">Totale Animali:</span>
                <span className="font-medium">{animalCount.toLocaleString('it-IT')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">Mortalità:</span>
                <span className="font-medium">{mortalityRate}%</span>
              </div>
            </div>
            
            {/* Note operative opzionali */}
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <div className="text-xs font-medium mb-2 text-slate-600">📝 Note (opzionali)</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Posizione vagliatura */}
                <div className="space-y-1">
                  <span className="text-slate-500">Posizione:</span>
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="screeningPos"
                        checked={screeningPosition === 'sopra'}
                        onChange={() => setScreeningPosition('sopra')}
                        className="w-3 h-3"
                      />
                      <span>Sopra</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="screeningPos"
                        checked={screeningPosition === 'sotto'}
                        onChange={() => setScreeningPosition('sotto')}
                        className="w-3 h-3"
                      />
                      <span>Sotto</span>
                    </label>
                    {screeningPosition && (
                      <button
                        type="button"
                        onClick={() => setScreeningPosition(null)}
                        className="text-red-500 hover:text-red-700 text-left text-[10px]"
                      >
                        ✕ Rimuovi
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Qualità */}
                <div className="space-y-1">
                  <span className="text-slate-500">Qualità:</span>
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="qualityN"
                        checked={qualityNote === 'belli'}
                        onChange={() => setQualityNote('belli')}
                        className="w-3 h-3"
                      />
                      <span>Belli</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="qualityN"
                        checked={qualityNote === 'brutti'}
                        onChange={() => setQualityNote('brutti')}
                        className="w-3 h-3"
                      />
                      <span>Brutti</span>
                    </label>
                    {qualityNote && (
                      <button
                        type="button"
                        onClick={() => setQualityNote(null)}
                        className="text-red-500 hover:text-red-700 text-left text-[10px]"
                      >
                        ✕ Rimuovi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottoni compatti */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClose}
                className="flex-1 h-7 text-xs"
              >
                Annulla
              </Button>
              <Button 
                size="sm" 
                onClick={handleConfirm}
                className="flex-1 h-7 text-xs"
              >
                Conferma
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}