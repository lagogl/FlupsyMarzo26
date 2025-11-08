import { db } from "../../../db";
import { eq, and } from "drizzle-orm";
import { task_operators, type Operator, type InsertOperator } from "@shared/schema";

export class OperatorsService {
  /**
   * Get all operators
   */
  async getAllOperators(activeOnly = false) {
    if (activeOnly) {
      return await db.select().from(task_operators)
        .where(eq(task_operators.active, true))
        .orderBy(task_operators.lastName, task_operators.firstName);
    }
    return await db.select().from(task_operators)
      .orderBy(task_operators.lastName, task_operators.firstName);
  }

  /**
   * Get operator by ID
   */
  async getOperatorById(id: number): Promise<Operator | undefined> {
    const [operator] = await db.select().from(task_operators)
      .where(eq(task_operators.id, id))
      .limit(1);
    return operator;
  }

  /**
   * Get operator by external app user ID
   */
  async getOperatorByExternalAppUserId(externalAppUserId: string): Promise<Operator | undefined> {
    const [operator] = await db.select().from(task_operators)
      .where(eq(task_operators.externalAppUserId, externalAppUserId))
      .limit(1);
    return operator;
  }

  /**
   * Create a new operator
   */
  async createOperator(data: InsertOperator): Promise<Operator> {
    const [operator] = await db.insert(task_operators)
      .values(data)
      .returning();
    return operator;
  }

  /**
   * Update an operator
   */
  async updateOperator(id: number, data: Partial<InsertOperator>): Promise<Operator | undefined> {
    const [operator] = await db.update(task_operators)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(task_operators.id, id))
      .returning();
    return operator;
  }

  /**
   * Deactivate operator (soft delete)
   */
  async deactivateOperator(id: number): Promise<Operator | undefined> {
    return await this.updateOperator(id, { active: false });
  }

  /**
   * Reactivate operator
   */
  async reactivateOperator(id: number): Promise<Operator | undefined> {
    return await this.updateOperator(id, { active: true });
  }

  /**
   * Delete operator (hard delete)
   */
  async deleteOperator(id: number): Promise<boolean> {
    const result = await db.delete(task_operators)
      .where(eq(task_operators.id, id))
      .returning();
    return result.length > 0;
  }
}

export const operatorsService = new OperatorsService();
