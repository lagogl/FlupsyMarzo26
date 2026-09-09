import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  ddtRighe,
  externalProductCatalog,
  sizeExternalProductMappings,
  sizes
} from "../../shared/schema";

export type ProductProvider = "fic" | "fcloud";

export interface ImportedExternalProduct {
  externalProductId: string | null;
  code: string;
  name: string;
  description?: string | null;
  unitOfMeasure?: string | null;
  active?: boolean;
}

export interface ProductSnapshot {
  externalProductId: string | null;
  code: string;
  name: string;
}

export async function replaceExternalProductCatalog(
  provider: ProductProvider,
  companyKey: string,
  products: ImportedExternalProduct[]
) {
  const normalized = products
    .map((product) => ({
      ...product,
      code: product.code.trim(),
      name: product.name.trim()
    }))
    .filter((product) => product.code && product.name);

  const importedCodes = normalized.map((product) => product.code);
  await db.transaction(async (tx) => {
    await tx.update(externalProductCatalog)
      .set({ active: false, updatedAt: new Date() })
      .where(and(
        eq(externalProductCatalog.provider, provider),
        eq(externalProductCatalog.companyKey, companyKey)
      ));

    for (const product of normalized) {
      await tx.insert(externalProductCatalog).values({
        provider,
        companyKey,
        externalProductId: product.externalProductId,
        code: product.code,
        name: product.name,
        description: product.description || null,
        unitOfMeasure: product.unitOfMeasure || null,
        active: product.active !== false,
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: [
          externalProductCatalog.provider,
          externalProductCatalog.companyKey,
          externalProductCatalog.code
        ],
        set: {
          externalProductId: product.externalProductId,
          name: product.name,
          description: product.description || null,
          unitOfMeasure: product.unitOfMeasure || null,
          active: product.active !== false,
          lastSyncedAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  });

  return { imported: importedCodes.length };
}

export async function listProductMappings(
  provider: ProductProvider,
  companyKey: string
) {
  const [allSizes, products, mappings] = await Promise.all([
    db.select().from(sizes).orderBy(sizes.code),
    db.select().from(externalProductCatalog)
      .where(and(
        eq(externalProductCatalog.provider, provider),
        eq(externalProductCatalog.companyKey, companyKey),
        eq(externalProductCatalog.active, true)
      ))
      .orderBy(externalProductCatalog.code),
    db.select().from(sizeExternalProductMappings)
      .where(and(
        eq(sizeExternalProductMappings.provider, provider),
        eq(sizeExternalProductMappings.companyKey, companyKey)
      ))
  ]);

  const mappingBySize = new Map(mappings.map((mapping) => [mapping.sizeId, mapping]));
  return {
    products: products.map(({ id, externalProductId, code, name, description, unitOfMeasure }) => ({
      id,
      externalProductId,
      code,
      name,
      description,
      unitOfMeasure
    })),
    sizes: allSizes.map((size) => {
      const mapping = mappingBySize.get(size.id);
      const product = mapping
        ? products.find((candidate) => candidate.id === mapping.productCatalogId)
        : undefined;
      return {
        id: size.id,
        code: size.code,
        name: size.name,
        mappedProductId: product?.id || null,
        mappedProductCode: product?.code || null,
        mappedProductName: product?.name || null
      };
    })
  };
}

export async function saveProductMapping(params: {
  provider: ProductProvider;
  companyKey: string;
  sizeId: number;
  productCatalogId: number;
}) {
  const { provider, companyKey, sizeId, productCatalogId } = params;
  const [product] = await db.select().from(externalProductCatalog)
    .where(and(
      eq(externalProductCatalog.id, productCatalogId),
      eq(externalProductCatalog.provider, provider),
      eq(externalProductCatalog.companyKey, companyKey),
      eq(externalProductCatalog.active, true)
    ))
    .limit(1);
  if (!product) {
    throw new Error("Prodotto non trovato nel catalogo selezionato");
  }

  await db.insert(sizeExternalProductMappings).values({
    sizeId,
    provider,
    companyKey,
    productCatalogId,
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: [
      sizeExternalProductMappings.sizeId,
      sizeExternalProductMappings.provider,
      sizeExternalProductMappings.companyKey
    ],
    set: { productCatalogId, updatedAt: new Date() }
  });
}

export async function deleteProductMapping(
  provider: ProductProvider,
  companyKey: string,
  sizeId: number
) {
  await db.delete(sizeExternalProductMappings).where(and(
    eq(sizeExternalProductMappings.sizeId, sizeId),
    eq(sizeExternalProductMappings.provider, provider),
    eq(sizeExternalProductMappings.companyKey, companyKey)
  ));
}

export async function getProductSnapshotsBySizeCodes(
  provider: ProductProvider,
  companyKey: string,
  sizeCodes: string[]
) {
  const uniqueCodes = [...new Set(sizeCodes.filter(Boolean))];
  if (uniqueCodes.length === 0) return new Map<string, ProductSnapshot>();

  const rows = await db.select({
    sizeCode: sizes.code,
    externalProductId: externalProductCatalog.externalProductId,
    productCode: externalProductCatalog.code,
    productName: externalProductCatalog.name
  })
    .from(sizes)
    .innerJoin(sizeExternalProductMappings, and(
      eq(sizeExternalProductMappings.sizeId, sizes.id),
      eq(sizeExternalProductMappings.provider, provider),
      eq(sizeExternalProductMappings.companyKey, companyKey)
    ))
    .innerJoin(externalProductCatalog, and(
      eq(externalProductCatalog.id, sizeExternalProductMappings.productCatalogId),
      eq(externalProductCatalog.active, true)
    ))
    .where(inArray(sizes.code, uniqueCodes));

  return new Map(rows.map((row) => [row.sizeCode, {
    externalProductId: row.externalProductId,
    code: row.productCode,
    name: row.productName
  }]));
}

export async function hydrateDdtProductSnapshots(params: {
  ddtId: number;
  ficCompanyKey: string;
  fcloudCompanyKey?: string | null;
}) {
  const rows = await db.select().from(ddtRighe)
    .where(eq(ddtRighe.ddtId, params.ddtId))
    .orderBy(ddtRighe.id);
  const productRows = rows.filter((row) =>
    row.sizeCode && !row.descrizione.toUpperCase().startsWith("SUBTOTALE")
  );
  const sizeCodes = productRows.map((row) => row.sizeCode!);
  const ficMappings = await getProductSnapshotsBySizeCodes("fic", params.ficCompanyKey, sizeCodes);
  const missingFic = [...new Set(productRows
    .filter((row) => !row.ficProductCode && !ficMappings.has(row.sizeCode!))
    .map((row) => row.sizeCode!))];
  if (missingFic.length > 0) {
    const error = new Error(`Manca l'associazione prodotto FIC per: ${missingFic.join(", ")}`);
    (error as any).code = "FIC_PRODUCT_MAPPING_REQUIRED";
    (error as any).missingSizeCodes = missingFic;
    throw error;
  }

  const fcloudMappings = params.fcloudCompanyKey
    ? await getProductSnapshotsBySizeCodes("fcloud", params.fcloudCompanyKey, sizeCodes)
    : new Map<string, ProductSnapshot>();

  for (const row of productRows) {
    const fic = ficMappings.get(row.sizeCode!);
    const fcloud = fcloudMappings.get(row.sizeCode!);
    await db.update(ddtRighe).set({
      ficProductId: row.ficProductCode ? row.ficProductId : (fic?.externalProductId || null),
      ficProductCode: row.ficProductCode || fic?.code || null,
      ficProductName: row.ficProductCode ? row.ficProductName : (fic?.name || null),
      fcloudProductId: row.fcloudProductCode ? row.fcloudProductId : (fcloud?.externalProductId || null),
      fcloudProductCode: row.fcloudProductCode || fcloud?.code || null,
      fcloudProductName: row.fcloudProductCode ? row.fcloudProductName : (fcloud?.name || null)
    }).where(eq(ddtRighe.id, row.id));
  }

  return db.select().from(ddtRighe)
    .where(eq(ddtRighe.ddtId, params.ddtId))
    .orderBy(ddtRighe.id);
}

export function buildAggregatedFicDdtItems(
  rows: Array<typeof ddtRighe.$inferSelect>
) {
  const grouped = new Map<string, {
    productId: string;
    name: string;
    sizeCode: string;
    quantity: number;
    descriptions: string[];
    measure: string;
    netPrice: number;
  }>();

  for (const row of rows) {
    if (!row.sizeCode || row.descrizione.toUpperCase().startsWith("SUBTOTALE")) continue;
    if (!row.ficProductCode || !row.ficProductId || !Number.isSafeInteger(Number(row.ficProductId))) {
      throw new Error(`Riga DDT ${row.id} senza prodotto FIC valido`);
    }
    const current = grouped.get(row.ficProductCode) || {
      productId: row.ficProductId,
      name: row.ficProductName || row.ficProductCode,
      sizeCode: row.sizeCode,
      quantity: 0,
      descriptions: [],
      measure: row.unitaMisura || "NR",
      netPrice: parseFloat(row.prezzoUnitario || "0")
    };
    current.quantity += parseFloat(row.quantita || "0");
    current.descriptions.push(row.descrizione);
    grouped.set(row.ficProductCode, current);
  }

  const items = [...grouped.values()].map((item) => ({
    product_id: Number(item.productId),
    name: item.name,
    description: `${item.sizeCode} · ${item.descriptions.join(" ; ")}`,
    qty: item.quantity,
    measure: item.measure,
    net_price: item.netPrice
  }));
  if (items.length === 0) {
    throw new Error("Il DDT non contiene righe prodotto associabili al catalogo FIC");
  }
  return items;
}