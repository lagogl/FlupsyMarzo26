import { pgTable, serial, integer, date, text, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// SCHEMA DATABASE ESTERNO (Condiviso)
// ========================================

// Tabella ordini condivisi (struttura adeguata alle specifiche)
export const ordiniCondivisi = pgTable("ordini", {
  id: serial("id").primaryKey(),
  numero: integer("numero"),
  data: date("data").notNull(),
  clienteId: integer("cliente_id").notNull(),
  clienteNome: text("cliente_nome"),
  stato: varchar("stato", { length: 50 }), // "Aperto" | "In Lavorazione" | "Parziale" | "Completato" | "Annullato"
  quantitaTotale: integer("quantita_totale").notNull().default(0), // Totale animali ordinati
  tagliaRichiesta: text("taglia_richiesta").notNull().default(''),
  
  // Date consegna (range)
  dataConsegna: date("data_consegna"), // Deprecato, per compatibilità
  dataInizioConsegna: date("data_inizio_consegna"),
  dataFineConsegna: date("data_fine_consegna"),
  
  // Sincronizzazione Fatture in Cloud
  fattureInCloudId: integer("fatture_in_cloud_id").unique(),
  fattureInCloudNumero: varchar("fatture_in_cloud_numero", { length: 50 }),
  companyId: integer("company_id"),
  syncStatus: varchar("sync_status", { length: 20 }).default('locale'), // "locale" | "in_sync" | "sincronizzato" | "errore"
  lastSyncAt: timestamp("last_sync_at"),
  syncError: text("sync_error"),
  urlDocumento: text("url_documento"),
  
  // Metadata
  totale: decimal("totale", { precision: 10, scale: 2 }).default("0"),
  valuta: text("valuta").default("EUR"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Tabella righe ordini condivisi
export const ordiniDettagli = pgTable("ordini_dettagli", {
  id: serial("id").primaryKey(),
  ordineId: integer("ordine_id").notNull().references(() => ordiniCondivisi.id, { onDelete: 'cascade' }),
  rigaNumero: integer("riga_numero").notNull().default(1),
  
  // Dati prodotto
  codiceProdotto: varchar("codice_prodotto", { length: 100 }),
  taglia: varchar("taglia", { length: 50 }).notNull().default(''),
  descrizione: text("descrizione"),
  
  // Quantità e prezzi
  quantita: decimal("quantita", { precision: 10, scale: 2 }).notNull(),
  unitaMisura: text("unita_misura").default("NR"),
  prezzoUnitario: decimal("prezzo_unitario", { precision: 10, scale: 4 }).notNull().default("0"),
  sconto: decimal("sconto", { precision: 10, scale: 2 }).default("0"),
  importoRiga: decimal("importo_riga", { precision: 10, scale: 2 }).default("0"),
  
  // Tracciabilità FIC
  ficItemId: integer("fic_item_id"),
  
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Tabella consegne condivise (da creare nel DB esterno)
export const consegneCondivise = pgTable("consegne_condivise", {
  id: serial("id").primaryKey(),
  ordineId: integer("ordine_id").notNull().references(() => ordiniCondivisi.id, { onDelete: 'restrict' }),
  dataConsegna: date("data_consegna").notNull(),
  quantitaConsegnata: integer("quantita_consegnata").notNull(),
  appOrigine: varchar("app_origine", { length: 50 }).notNull(), // "delta_futuro" | "app_esterna"
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Insert schemas
export const insertOrdineCondivisoSchema = createInsertSchema(ordiniCondivisi)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertOrdineDettaglioSchema = createInsertSchema(ordiniDettagli)
  .omit({ id: true, createdAt: true });

export const insertConsegnaCondivisaSchema = createInsertSchema(consegneCondivise)
  .omit({ id: true, createdAt: true });

// Types
export type OrdineCondiviso = typeof ordiniCondivisi.$inferSelect;
export type InsertOrdineCondiviso = z.infer<typeof insertOrdineCondivisoSchema>;

export type OrdineDettaglio = typeof ordiniDettagli.$inferSelect;
export type InsertOrdineDettaglio = z.infer<typeof insertOrdineDettaglioSchema>;

export type ConsegnaCondivisa = typeof consegneCondivise.$inferSelect;
export type InsertConsegnaCondivisa = z.infer<typeof insertConsegnaCondivisaSchema>;
