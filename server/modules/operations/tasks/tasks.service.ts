import { db } from "../../../db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { 
  selectionTasks, 
  selectionTaskBaskets, 
  selectionTaskAssignments,
  baskets,
  operators,
  selections,
  selectionSourceBaskets,
  sizes,
  type SelectionTask,
  type InsertSelectionTask,
  type InsertSelectionTaskBasket,
  type InsertSelectionTaskAssignment
} from "@shared/schema";

export class TasksService {
  /**
   * Get all tasks
   */
  async getAllTasks() {
    return await db.select().from(selectionTasks)
      .orderBy(sql`
        CASE ${selectionTasks.priority}
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        ${selectionTasks.dueDate} ASC NULLS LAST,
        ${selectionTasks.createdAt} DESC
      `);
  }

  /**
   * Get tasks by selection ID
   */
  async getTasksBySelectionId(selectionId: number) {
    return await db.select().from(selectionTasks)
      .where(eq(selectionTasks.selectionId, selectionId))
      .orderBy(selectionTasks.createdAt);
  }

  /**
   * Get task by ID with full details
   */
  async getTaskById(taskId: number) {
    const [task] = await db.select().from(selectionTasks)
      .where(eq(selectionTasks.id, taskId))
      .limit(1);
    
    if (!task) return null;

    // Get associated baskets
    const taskBaskets = await db.select({
      id: selectionTaskBaskets.id,
      basketId: selectionTaskBaskets.basketId,
      role: selectionTaskBaskets.role,
      physicalNumber: baskets.physicalNumber,
      flupsyId: baskets.flupsyId,
    })
    .from(selectionTaskBaskets)
    .leftJoin(baskets, eq(selectionTaskBaskets.basketId, baskets.id))
    .where(eq(selectionTaskBaskets.taskId, taskId));

    // Get assignments with operator details
    const assignments = await db.select({
      id: selectionTaskAssignments.id,
      operatorId: selectionTaskAssignments.operatorId,
      status: selectionTaskAssignments.status,
      assignedAt: selectionTaskAssignments.assignedAt,
      startedAt: selectionTaskAssignments.startedAt,
      completedAt: selectionTaskAssignments.completedAt,
      completionNotes: selectionTaskAssignments.completionNotes,
      operatorFirstName: operators.firstName,
      operatorLastName: operators.lastName,
      operatorEmail: operators.email,
    })
    .from(selectionTaskAssignments)
    .leftJoin(operators, eq(selectionTaskAssignments.operatorId, operators.id))
    .where(eq(selectionTaskAssignments.taskId, taskId));

    return {
      ...task,
      baskets: taskBaskets,
      assignments
    };
  }

  /**
   * Create a new task
   */
  async createTask(data: InsertSelectionTask): Promise<SelectionTask> {
    const [task] = await db.insert(selectionTasks)
      .values(data)
      .returning();
    return task;
  }

  /**
   * Update a task
   */
  async updateTask(taskId: number, data: Partial<InsertSelectionTask>): Promise<SelectionTask | undefined> {
    const [task] = await db.update(selectionTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(selectionTasks.id, taskId))
      .returning();
    return task;
  }

  /**
   * Delete a task and all related data
   */
  async deleteTask(taskId: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Delete assignments
      await tx.delete(selectionTaskAssignments)
        .where(eq(selectionTaskAssignments.taskId, taskId));
      
      // Delete task baskets
      await tx.delete(selectionTaskBaskets)
        .where(eq(selectionTaskBaskets.taskId, taskId));
      
      // Delete task
      const result = await tx.delete(selectionTasks)
        .where(eq(selectionTasks.id, taskId))
        .returning();
      
      return result.length > 0;
    });
  }

  /**
   * Add baskets to a task
   */
  async addBasketsToTask(taskId: number, basketsData: InsertSelectionTaskBasket[]) {
    return await db.insert(selectionTaskBaskets)
      .values(basketsData)
      .returning();
  }

  /**
   * Remove basket from task
   */
  async removeBasketFromTask(taskBasketId: number): Promise<boolean> {
    const result = await db.delete(selectionTaskBaskets)
      .where(eq(selectionTaskBaskets.id, taskBasketId))
      .returning();
    return result.length > 0;
  }

  /**
   * Assign operators to a task
   */
  async assignOperators(taskId: number, operatorIds: number[]) {
    const assignments = operatorIds.map(operatorId => ({
      taskId,
      operatorId,
      status: 'assigned' as const
    }));

    return await db.insert(selectionTaskAssignments)
      .values(assignments)
      .returning();
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(
    assignmentId: number, 
    status: 'assigned' | 'accepted' | 'in_progress' | 'completed',
    completionNotes?: string
  ) {
    const updateData: any = { 
      status,
      externalAppSyncedAt: new Date() 
    };

    if (status === 'in_progress' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
      if (completionNotes) {
        updateData.completionNotes = completionNotes;
      }
    }

    const [assignment] = await db.update(selectionTaskAssignments)
      .set(updateData)
      .where(eq(selectionTaskAssignments.id, assignmentId))
      .returning();

    // Check if all assignments are completed, then update task status
    if (status === 'completed') {
      await this.checkAndUpdateTaskCompletion(assignment.taskId);
    }

    return assignment;
  }

  /**
   * Check if all assignments are completed and update task status
   */
  private async checkAndUpdateTaskCompletion(taskId: number) {
    const allAssignments = await db.select()
      .from(selectionTaskAssignments)
      .where(eq(selectionTaskAssignments.taskId, taskId));

    const allCompleted = allAssignments.every(a => a.status === 'completed');

    if (allCompleted && allAssignments.length > 0) {
      await db.update(selectionTasks)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(selectionTasks.id, taskId));
    }
  }

  /**
   * Complete a task (mark as completed manually)
   */
  async completeTask(taskId: number) {
    return await db.update(selectionTasks)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(selectionTasks.id, taskId))
      .returning();
  }

  /**
   * Get tasks assigned to an operator (for external app)
   */
  async getTasksForOperator(operatorId: number, statusFilter?: string[]) {
    let query = db.select({
      taskId: selectionTasks.id,
      taskType: selectionTasks.taskType,
      description: selectionTasks.description,
      priority: selectionTasks.priority,
      taskStatus: selectionTasks.status,
      dueDate: selectionTasks.dueDate,
      selectionId: selectionTasks.selectionId,
      selectionNumber: selections.selectionNumber,
      selectionDate: selections.date,
      assignmentId: selectionTaskAssignments.id,
      assignmentStatus: selectionTaskAssignments.status,
      assignedAt: selectionTaskAssignments.assignedAt,
      startedAt: selectionTaskAssignments.startedAt,
      completedAt: selectionTaskAssignments.completedAt,
    })
    .from(selectionTaskAssignments)
    .innerJoin(selectionTasks, eq(selectionTaskAssignments.taskId, selectionTasks.id))
    .leftJoin(selections, eq(selectionTasks.selectionId, selections.id))
    .where(eq(selectionTaskAssignments.operatorId, operatorId));

    if (statusFilter && statusFilter.length > 0) {
      query = query.where(
        and(
          eq(selectionTaskAssignments.operatorId, operatorId),
          inArray(selectionTaskAssignments.status, statusFilter as any)
        )
      );
    }

    return await query.orderBy(
      sql`
        CASE ${selectionTasks.priority}
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        ${selectionTasks.dueDate} ASC NULLS LAST
      `
    );
  }

  /**
   * Get baskets for a specific task (for external app)
   */
  async getTaskBaskets(taskId: number) {
    return await db.select({
      id: selectionTaskBaskets.id,
      basketId: selectionTaskBaskets.basketId,
      role: selectionTaskBaskets.role,
      physicalNumber: baskets.physicalNumber,
      flupsyId: baskets.flupsyId,
      animalCount: selectionSourceBaskets.animalCount,
      totalWeight: selectionSourceBaskets.totalWeight,
      animalsPerKg: selectionSourceBaskets.animalsPerKg,
      sizeId: selectionSourceBaskets.sizeId,
      sizeName: sizes.name,
    })
    .from(selectionTaskBaskets)
    .leftJoin(baskets, eq(selectionTaskBaskets.basketId, baskets.id))
    .leftJoin(selectionSourceBaskets, eq(selectionTaskBaskets.basketId, selectionSourceBaskets.basketId))
    .leftJoin(sizes, eq(selectionSourceBaskets.sizeId, sizes.id))
    .where(eq(selectionTaskBaskets.taskId, taskId));
  }
}

export const tasksService = new TasksService();
