import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { AUTH_PROVIDER, AuthProvider } from './auth.provider';
import { AuthUser } from '../models/auth-user.model';

const mockUser: AuthUser = {
  sub: '123',
  email: 'test@test.com',
  name: 'Test User',
  picture: 'https://example.com/pic.jpg',
  idToken: 'fake.jwt.token',
};

const createMockProvider = (overrides: Partial<AuthProvider> = {}): AuthProvider => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  signInWithGoogle: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  getCurrentUser: vi.fn().mockReturnValue(null),
  isAuthenticated: vi.fn().mockReturnValue(false),
  getIdToken: vi.fn().mockReturnValue(null),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let mockProvider: AuthProvider;

  function setup(providerOverrides: Partial<AuthProvider> = {}) {
    mockProvider = createMockProvider(providerOverrides);
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_PROVIDER, useValue: mockProvider },
      ],
    });
    service = TestBed.inject(AuthService);
  }

  it('should set state to authenticated when provider has valid token', async () => {
    setup({
      getCurrentUser: vi.fn().mockReturnValue(mockUser),
      isAuthenticated: vi.fn().mockReturnValue(true),
    });
    await service.initialize();
    expect(service.authState()).toBe('authenticated');
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should set state to unauthenticated when no token', async () => {
    setup();
    await service.initialize();
    expect(service.authState()).toBe('unauthenticated');
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should set state to error when initialize throws', async () => {
    setup({
      initialize: vi.fn().mockRejectedValue(new Error('Network error')),
    });
    await service.initialize();
    expect(service.authState()).toBe('error');
  });

  it('should clear currentUser and set unauthenticated on signOut', async () => {
    setup({
      getCurrentUser: vi.fn().mockReturnValue(mockUser),
      isAuthenticated: vi.fn().mockReturnValue(true),
    });
    await service.initialize();
    await service.signOut();
    expect(service.currentUser()).toBeNull();
    expect(service.authState()).toBe('unauthenticated');
  });
});
