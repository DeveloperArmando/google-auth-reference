import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) return true;

  const reason = authService.authState() === 'error' ? 'error' : 'unauthorized';
  return router.createUrlTree(['/access-denied'], {
    queryParams: { reason, returnUrl: state.url },
  });
};
