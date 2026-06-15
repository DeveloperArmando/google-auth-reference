import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { signal, computed } from '@angular/core';

const mockActivatedRoute = {} as ActivatedRouteSnapshot;

function mockRouterState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('authGuard', () => {
  let loggedIn: ReturnType<typeof signal<boolean>>;
  let authStateValue: ReturnType<typeof signal<string>>;

  beforeEach(() => {
    loggedIn = signal(false);
    authStateValue = signal('unauthenticated');

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: computed(() => loggedIn()),
            authState: computed(() => authStateValue()),
          },
        },
      ],
    });
  });

  it('should allow access when user is logged in', () => {
    loggedIn.set(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockActivatedRoute, mockRouterState('/dashboard'))
    );

    expect(result).toBe(true);
  });

  it('should redirect to /access-denied with reason=unauthorized when not logged in', () => {
    loggedIn.set(false);
    authStateValue.set('unauthenticated');

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockActivatedRoute, mockRouterState('/dashboard'))
    );

    const router = TestBed.inject(Router);
    expect(result).toEqual(
      router.createUrlTree(['/access-denied'], {
        queryParams: { reason: 'unauthorized', returnUrl: '/dashboard' },
      })
    );
  });

  it('should redirect to /access-denied with reason=error when auth state is error', () => {
    loggedIn.set(false);
    authStateValue.set('error');

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockActivatedRoute, mockRouterState('/settings'))
    );

    const router = TestBed.inject(Router);
    expect(result).toEqual(
      router.createUrlTree(['/access-denied'], {
        queryParams: { reason: 'error', returnUrl: '/settings' },
      })
    );
  });
});
