/**
 * @module auth/services
 * @description Authentication service for IO operations
 * @safety RED
 */

import type { LoginCredentials, AuthResult, User } from '../domain/auth.types';

export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshSession(): Promise<AuthResult>;
}

export function createAuthService(): AuthService {
  return {
    async login(_credentials: LoginCredentials): Promise<AuthResult> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async logout(): Promise<void> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async getCurrentUser(): Promise<User | null> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async refreshSession(): Promise<AuthResult> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },
  };
}
