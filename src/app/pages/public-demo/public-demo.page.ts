import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-public-demo',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Página pública</h1>
    <p>Esta ruta es accesible sin autenticación.</p>

    @if (auth.isLoggedIn()) {
      <p>Estás logueado como <strong>{{ auth.currentUser()?.name }}</strong>. <a routerLink="/home">Ir a home →</a></p>
    } @else {
      <p>No has iniciado sesión. <a routerLink="/login">Iniciar sesión →</a></p>
    }
  `,
})
export class PublicDemoPage {
  auth = inject(AuthService);
}
