export function advancedSaleStatusLabel(status: string): string {
  switch (status) {
    case "draft": return "Bozza";
    case "confirmed": return "Confermata";
    case "completed": return "Completata";
    case "cancelled": return "Stornata";
    default: return "Stato non riconosciuto";
  }
}