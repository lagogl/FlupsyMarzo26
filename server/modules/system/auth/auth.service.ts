import { storage } from "../../../storage";

export class AuthService {
  /**
   * Validate user credentials
   */
  async validateUser(username: string, password: string) {
    return await storage.validateUser(username, password);
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string) {
    return await storage.getUserByUsername(username);
  }

  /**
   * Create new user
   */
  async createUser(userData: any) {
    return await storage.createUser(userData);
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    return await storage.changeUserPassword(userId, currentPassword, newPassword);
  }

  /**
   * Sanitize user data for response (remove password)
   */
  sanitizeUser(user: any) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      language: user.language,
      lastLogin: user.lastLogin
    };
  }
}

export const authService = new AuthService();
