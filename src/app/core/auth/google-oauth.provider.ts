import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthProvider } from './auth.provider';
import { AuthUser } from '../models/auth-user.model';
import { environment } from '../../../environments/environment';

@Injectable()
export class GoogleOAuthProvider implements AuthProvider {
  constructor(private oauthService: OAuthService) {}

  async initialize(): Promise<void> {
    this.oauthService.configure({
      issuer: 'https://accounts.google.com',
      redirectUri: window.location.origin,
      clientId: environment.googleClientId,
      scope: 'openid profile email',
      strictDiscoveryDocumentValidation: false,
    });
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  async signInWithGoogle(): Promise<void> {
    this.oauthService.initCodeFlow();
  }

  async signOut(): Promise<void> {
    this.oauthService.logOut();
  }

  getCurrentUser(): AuthUser | null {
    if (!this.oauthService.hasValidIdToken()) return null;
    const claims = this.oauthService.getIdentityClaims() as Record<string, string>;
    return {
      sub: claims['sub'],
      email: claims['email'],
      name: claims['name'],
      picture: claims['picture'],
      idToken: this.oauthService.getIdToken(),
    };
  }

  isAuthenticated(): boolean {
    return this.oauthService.hasValidIdToken();
  }

  getIdToken(): string | null {
    return this.oauthService.getIdToken() || null;
  }
}
