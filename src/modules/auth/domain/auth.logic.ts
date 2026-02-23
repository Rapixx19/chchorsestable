/**
 * @module auth/domain
 * @description Pure business logic for authentication
 * @safety RED
 */

import type { LoginCredentials } from './auth.types';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function validateCredentials(credentials: LoginCredentials): string[] {
  const errors: string[] = [];

  if (!validateEmail(credentials.email)) {
    errors.push('Invalid email format');
  }

  if (!validatePassword(credentials.password)) {
    errors.push('Password must be at least 8 characters');
  }

  return errors;
}
