import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Bienvenido, {{ auth.currentUser()?.name }}</h1>
    <img [src]="auth.currentUser()?.picture" [alt]="auth.currentUser()?.name" width="64" style="border-radius: 50%">
    <p>{{ auth.currentUser()?.email }}</p>
    <a routerLink="/profile">Ver claims del token →</a>
  `,
})
export class HomePage {
  auth = inject(AuthService);
}
