import { storage } from "../../../storage";
import NodeCache from "node-cache";

// Cache per sizes (TTL: 300 secondi = 5 minuti, raramente cambiano)
const sizesCache = new NodeCache({ stdTTL: 300 });

export class SizesService {
  /**
   * Get all sizes
   */
  async getAllSizes() {
    const cacheKey = "all-sizes";
    const cached = sizesCache.get(cacheKey);
    if (cached) {
      console.log("📦 SIZES SERVICE: Returning cached sizes");
      return cached;
    }

    const sizes = await storage.getSizes();
    sizesCache.set(cacheKey, sizes);
    return sizes;
  }

  /**
   * Get size by ID
   */
  async getSizeById(id: number) {
    const cacheKey = `size-${id}`;
    const cached = sizesCache.get(cacheKey);
    if (cached) {
      console.log(`📦 SIZES SERVICE: Returning cached size ${id}`);
      return cached;
    }

    const size = await storage.getSize(id);
    if (size) {
      sizesCache.set(cacheKey, size);
    }
    return size;
  }

  /**
   * Create new size
   */
  async createSize(sizeData: any) {
    const result = await storage.createSize(sizeData);
    this.invalidateCache(); // Invalida DOPO il salvataggio
    return result;
  }

  /**
   * Update size
   */
  async updateSize(id: number, updateData: any) {
    const result = await storage.updateSize(id, updateData);
    this.invalidateCache(); // Invalida DOPO il salvataggio
    return result;
  }

  /**
   * Delete size
   */
  async deleteSize(id: number) {
    const result = await storage.deleteSize(id);
    this.invalidateCache(); // Invalida DOPO il salvataggio
    return result;
  }

  /**
   * Invalidate all sizes cache
   */
  private invalidateCache() {
    sizesCache.flushAll();
    console.log("🧹 SIZES SERVICE: Cache invalidated");
    
    // Invalida anche il cache privato in db-storage
    storage.invalidateSizesCache();
  }
}

export const sizesService = new SizesService();
