import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const SIEVE_SIZES = [500, 790, 1000, 1250, 1600, 2000, 2500, 3000, 3500, 4000, 5000, 6000];

export function formatSieveName(
  sieveUp: number | null | undefined,
  sieveDown: number | null | undefined,
  date: string | Date | null | undefined,
  fmt: 'full' | 'compact' | 'ultracompact' = 'full'
): string {
  if (!sieveUp && !sieveDown) return '';

  const upPart = sieveUp ? `+${sieveUp}` : '';
  const downPart = sieveDown ? `-${sieveDown}` : '';
  const sievePart = [upPart, downPart].filter(Boolean).join(' ');

  if (fmt === 'ultracompact') {
    const upK = sieveUp ? `+${sieveUp >= 1000 ? sieveUp / 1000 + 'K' : sieveUp}` : '';
    const downK = sieveDown ? `-${sieveDown >= 1000 ? sieveDown / 1000 + 'K' : sieveDown}` : '';
    return [upK, downK].filter(Boolean).join(' ');
  }

  if (fmt === 'compact') return sievePart;

  if (!date) return sievePart;
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = format(d, 'dd/MM/yyyy', { locale: it });
  return `${sievePart} del ${dateStr}`;
}
