import { InjectionToken } from '@angular/core';
import { AuthUser } from '../models/auth-user.model';

export interface AuthProvider {
  initialize(): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): AuthUser | null;
  isAuthenticated(): boolean;
  getIdToken(): string | null;
}

export const AUTH_PROVIDER = new InjectionToken<AuthProvider>('AUTH_PROVIDER');
