export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
  idToken: string;
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error';
