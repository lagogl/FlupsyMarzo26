import { db } from "../../../db";
import {
  notifications,
  notificationSettings,
  type InsertNotification
} from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";

interface NotificationOptions {
  unreadOnly?: boolean;
  type?: string;
  page?: number;
  pageSize?: number;
}

export class NotificationsService {
  async getNotifications(options: NotificationOptions = {}) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.max(1, options.pageSize ?? 20);
    const conditions = [
      ...(options.unreadOnly ? [eq(notifications.isRead, false)] : []),
      ...(options.type ? [eq(notifications.type, options.type)] : [])
    ];
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [countResult, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(where),
      db.select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
    ]);
    const totalCount = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      success: true,
      notifications: rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  async createNotification(data: InsertNotification) {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async markAsRead(id: number) {
    const [notification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllAsRead() {
    return db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false))
      .returning();
  }

  async getSettings(type?: string) {
    if (type) {
      return db.select().from(notificationSettings)
        .where(eq(notificationSettings.notificationType, type));
    }
    return db.select().from(notificationSettings);
  }

  async updateSettings(type: string, settings: {
    isEnabled?: boolean;
    targetSizeIds?: unknown;
  }) {
    const [updated] = await db.update(notificationSettings)
      .set({
        ...(settings.isEnabled === undefined ? {} : { isEnabled: settings.isEnabled }),
        ...(settings.targetSizeIds === undefined ? {} : { targetSizeIds: settings.targetSizeIds }),
        updatedAt: new Date()
      })
      .where(eq(notificationSettings.notificationType, type))
      .returning();
    return updated;
  }
}

export const notificationsService = new NotificationsService();