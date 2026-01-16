import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { insertUserSchema } from "@shared/schema";

export class AuthController {
  /**
   * POST /api/login
   * User login
   */
  async login(req: Request, res: Response) {
    try {
      let { username, password } = req.body;
      
      // Input sanitization
      if (username) username = username.trim();
      if (password) password = password.trim();
      
      console.log(`Tentativo di login - Username: '${username}', Password: ${password ? '******' : 'undefined'}`);
      
      if (!username || !password) {
        console.log("Login fallito: username o password mancanti");
        return res.status(400).json({ 
          success: false, 
          message: "Username e password sono richiesti" 
        });
      }
      
      console.log(`Verifica credenziali per utente: '${username}'`);
      const validatedUser = await authService.validateUser(username, password);
      
      if (validatedUser) {
        console.log(`Login riuscito per l'utente: ${username}`);
        
        const userResponse = authService.sanitizeUser(validatedUser);
        
        return res.json({
          success: true,
          user: userResponse
        });
      } else {
        console.log(`Login fallito per l'utente: ${username}`);
        return res.status(401).json({
          success: false,
          message: "Credenziali non valide"
        });
      }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({
        success: false,
        message: "Errore durante l'autenticazione"
      });
    }
  }

  /**
   * POST /api/logout
   * User logout
   */
  async logout(req: Request, res: Response) {
    try {
      return res.status(200).json({
        success: true,
        message: "Logout effettuato con successo"
      });
    } catch (error) {
      console.error("Errore durante il logout:", error);
      return res.status(500).json({
        success: false,
        message: "Errore durante il logout"
      });
    }
  }

  /**
   * POST /api/register
   * User registration
   */
  async register(req: Request, res: Response) {
    try {
      // Validate user data
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Dati non validi",
          errors: validationResult.error.errors
        });
      }
      
      // Check if user already exists
      const existingUser = await authService.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Username già in uso"
        });
      }
      
      // Create new user
      const newUser = await authService.createUser(req.body);
      
      const userResponse = authService.sanitizeUser(newUser);
      
      res.status(201).json({
        success: true,
        user: userResponse
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({
        success: false,
        message: "Errore durante la registrazione"
      });
    }
  }

  /**
   * GET /api/users/current
   * Get current authenticated user
   */
  async getCurrentUser(req: Request, res: Response) {
    // In a real implementation, verify authentication via session/JWT
    // For this simplified version, return not authenticated
    res.json({
      success: false,
      message: "Non autenticato"
    });
  }

  /**
   * POST /api/change-password
   * Change user password - requires current password validation (self-service)
   * Security: Current password verification prevents unauthorized changes
   */
  async changePassword(req: Request, res: Response) {
    try {
      const { userId, currentPassword, newPassword } = req.body;

      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "ID utente, password attuale e nuova password sono richiesti"
        });
      }

      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum) || userIdNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID utente non valido"
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La nuova password deve essere di almeno 6 caratteri"
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: "La nuova password deve essere diversa da quella attuale"
        });
      }

      const result = await authService.changePassword(userIdNum, currentPassword, newPassword);
      
      if (result.success) {
        console.log(`✅ Password changed successfully for user ID ${userIdNum}`);
        return res.json({
          success: true,
          message: "Password modificata con successo"
        });
      } else {
        console.log(`❌ Password change failed for user ID ${userIdNum}: ${result.message}`);
        return res.status(400).json({
          success: false,
          message: result.message || "Password attuale non corretta"
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({
        success: false,
        message: "Errore durante il cambio password"
      });
    }
  }
}

export const authController = new AuthController();
