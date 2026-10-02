export class CommercialBusyError extends Error {
  constructor() {
    super("Calcoli commerciali in attesa: attendere il risultato corrente e riprovare.");
    this.name = "CommercialBusyError";
  }
}
export function createAdmission(maxGlobal = 12, maxPerOwner = 2) {
  let total = 0;
  const owners = new Map<string, number>();
  return (owner: string) => {
    if (total >= maxGlobal || (owners.get(owner) ?? 0) >= maxPerOwner) throw new CommercialBusyError();
    total++; owners.set(owner, (owners.get(owner) ?? 0) + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true; total--;
      const count = owners.get(owner)! - 1;
      if (count === 0) owners.delete(owner); else owners.set(owner, count);
    };
  };
}
export const admitCalculation = createAdmission();