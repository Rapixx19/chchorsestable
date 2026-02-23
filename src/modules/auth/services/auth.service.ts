/**
 * @module auth/services
 * @description Authentication service using Supabase
 * @safety RED
 */

import { supabase } from "@/infra/supabase/client";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthResult>;
  signup(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<AuthResult>;
  getCurrentUser(): Promise<AuthResult & { user?: unknown }>;
}

class SupabaseAuthService implements AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async signup(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async logout(): Promise<AuthResult> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async getCurrentUser(): Promise<AuthResult & { user?: unknown }> {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  }
}

export const authService: AuthService = new SupabaseAuthService();
