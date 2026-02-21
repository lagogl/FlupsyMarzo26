import { db } from "../../../db";
import { userMenuPreferences } from "@shared/schema";
import { eq } from "drizzle-orm";

export class MenuPreferencesService {
  async getPreferences(userId: number) {
    const [result] = await db
      .select()
      .from(userMenuPreferences)
      .where(eq(userMenuPreferences.userId, userId));
    return result;
  }

  async savePreferences(userId: number, menuItems: string[], compactModeEnabled: boolean) {
    const existing = await this.getPreferences(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userMenuPreferences)
        .set({ 
          menuItems, 
          compactModeEnabled,
          updatedAt: new Date()
        })
        .where(eq(userMenuPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userMenuPreferences)
        .values({ userId, menuItems, compactModeEnabled })
        .returning();
      return created;
    }
  }

  async savePreferredFlupsyIds(userId: number, preferredFlupsyIds: number[]) {
    const existing = await this.getPreferences(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userMenuPreferences)
        .set({ preferredFlupsyIds, updatedAt: new Date() })
        .where(eq(userMenuPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userMenuPreferences)
        .values({ userId, menuItems: [], compactModeEnabled: false, preferredFlupsyIds })
        .returning();
      return created;
    }
  }

  async toggleCompactMode(userId: number) {
    const existing = await this.getPreferences(userId);
    const newMode = existing ? !existing.compactModeEnabled : true;
    
    if (existing) {
      const [updated] = await db
        .update(userMenuPreferences)
        .set({ compactModeEnabled: newMode, updatedAt: new Date() })
        .where(eq(userMenuPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userMenuPreferences)
        .values({ userId, menuItems: [], compactModeEnabled: newMode })
        .returning();
      return created;
    }
  }
}

export const menuPreferencesService = new MenuPreferencesService();
