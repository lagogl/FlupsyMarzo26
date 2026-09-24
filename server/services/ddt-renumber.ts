export interface RenumberableDdt {
  ddtStato: string;
  fcloudDdtId: string | null;
  fcloudStato: string | null;
  fattureInCloudId: number | null;
  fattureInCloudNumero: string | null;
}

/** An attempted external delivery is not evidence that it is safe to retry or renumber. */
export function canRenumberDdt(ddt: RenumberableDdt): boolean {
  return ddt.ddtStato === 'locale'
    && ddt.fcloudDdtId == null
    && ddt.fcloudStato == null
    && ddt.fattureInCloudId == null
    && ddt.fattureInCloudNumero == null;
}

/** Recheck after taking the row lock: a competing send or renumber invalidates the snapshot. */
export function matchesLockedLocalDraft(
  initial: RenumberableDdt & { numero: number; companyId: number; year: number },
  locked: RenumberableDdt & { numero: number; companyId: number; year: number }
): boolean {
  return canRenumberDdt(locked)
    && locked.numero === initial.numero
    && locked.companyId === initial.companyId
    && locked.year === initial.year;
}