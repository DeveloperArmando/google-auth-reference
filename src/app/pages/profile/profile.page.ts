import { Component, computed, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <h1>Perfil — Claims del id_token</h1>

    <section>
      <h2>Datos del usuario</h2>
      <ul>
        <li><strong>sub</strong> (Google ID único): {{ user()?.sub }}</li>
        <li><strong>email:</strong> {{ user()?.email }}</li>
        <li><strong>name:</strong> {{ user()?.name }}</li>
        <li><strong>picture:</strong> <img [src]="user()?.picture" width="32" style="border-radius: 50%; vertical-align: middle"></li>
      </ul>
    </section>

    <section>
      <h2>id_token decodificado</h2>
      <p style="font-size: 12px; color: #666">
        Este es el JWT que Google emitió. Está compuesto por header.payload.signature — cada parte es Base64 separada por puntos.
      </p>
      <h3>Header</h3>
      <pre>{{ decodedHeader() | json }}</pre>
      <h3>Payload (claims)</h3>
      <pre>{{ decodedPayload() | json }}</pre>
      <h3>Token raw</h3>
      <textarea readonly rows="4" style="width: 100%; font-size: 11px; font-family: monospace">{{ user()?.idToken }}</textarea>
    </section>
  `,
  styles: [`
    section { margin-bottom: 32px; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
  `],
})
export class ProfilePage {
  auth = inject(AuthService);
  user = this.auth.currentUser;

  decodedHeader = computed(() => {
    const token = this.user()?.idToken;
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[0]));
  });

  decodedPayload = computed(() => {
    const token = this.user()?.idToken;
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1]));
  });
}
