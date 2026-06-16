import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (auth.authState() === 'error') {
      <div class="error-banner">
        Error al conectar con el servicio de autenticación. Verifica tu conexión a internet.
      </div>
    }

    <nav>
      <a routerLink="/">Inicio público</a>
      @if (auth.isLoggedIn()) {
        <a routerLink="/home">Home</a>
        <a routerLink="/profile">Perfil</a>
        <button (click)="auth.signOut()">Cerrar sesión</button>
      } @else {
        <a routerLink="/login">Login</a>
      }
    </nav>

    <main>
      <router-outlet />
    </main>
  `,
  styles: [`
    .error-banner {
      background: #fee;
      color: #c00;
      padding: 8px 16px;
      text-align: center;
    }
    nav { display: flex; gap: 16px; padding: 16px; background: #f5f5f5; align-items: center; }
    nav a { text-decoration: none; color: #333; }
    main { padding: 24px; }
  `],
})
export class App {
  auth = inject(AuthService);
}
