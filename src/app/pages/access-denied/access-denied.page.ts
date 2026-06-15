import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

const MESSAGES: Record<string, string> = {
  unauthorized: 'Debes iniciar sesión para acceder a esta página.',
  expired: 'Tu sesión ha expirado. Por favor vuelve a iniciar sesión.',
  error: 'Ocurrió un error con el servicio de autenticación.',
};

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Acceso denegado</h1>
    <p>{{ message() }}</p>
    <a routerLink="/login">Ir al login →</a>
  `,
})
export class AccessDeniedPage {
  private route = inject(ActivatedRoute);

  message = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => MESSAGES[params.get('reason') ?? ''] ?? MESSAGES['unauthorized'])
    ),
    { initialValue: MESSAGES['unauthorized'] }
  );
}
