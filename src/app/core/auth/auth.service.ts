import { computed, inject, Injectable, signal } from '@angular/core';
import { AUTH_PROVIDER } from './auth.provider';
import { AuthState, AuthUser } from '../models/auth-user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private provider = inject(AUTH_PROVIDER);

  readonly currentUser = signal<AuthUser | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly authState = signal<AuthState>('loading');

  async initialize(): Promise<void> {
    try {
      await this.provider.initialize();
      this.currentUser.set(this.provider.getCurrentUser());
      this.authState.set(this.provider.isAuthenticated() ? 'authenticated' : 'unauthenticated');
    } catch {
      this.authState.set('error');
    }
  }

  async signInWithGoogle(): Promise<void> {
    await this.provider.signInWithGoogle();
  }

  async signOut(): Promise<void> {
    await this.provider.signOut();
    this.currentUser.set(null);
    this.authState.set('unauthenticated');
  }
}
