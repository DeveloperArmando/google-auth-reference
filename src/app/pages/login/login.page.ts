import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-container">
      <h1>Iniciar sesión</h1>
      <p>Accede con tu cuenta de Google para continuar.</p>
      <button (click)="signIn()" class="google-btn">
        Sign in with Google
      </button>
    </div>
  `,
  styles: [`
    .login-container { max-width: 400px; margin: 80px auto; text-align: center; }
    .google-btn {
      margin-top: 24px;
      padding: 12px 24px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    }
    .google-btn:hover { background: #357ae8; }
  `],
})
export class LoginPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      void this.router.navigate(['/home']);
    }
  }

  signIn() {
    this.auth.signInWithGoogle();
  }
}
