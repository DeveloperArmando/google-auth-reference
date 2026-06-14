# Google Auth Angular Reference — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una app Angular 17+ de referencia personal que implementa login con Google OAuth usando `angular-oauth2-oidc`, con Strategy Pattern para poder cambiar de proveedor de auth con una sola línea.

**Architecture:** `AuthService` depende de una interfaz `AuthProvider` inyectada via DI token. `GoogleOAuthProvider` implementa esa interfaz usando `angular-oauth2-oidc`. `APP_INITIALIZER` arranca el flujo OAuth al bootstrap. Angular Signals manejan el estado reactivo de sesión.

**Tech Stack:** Angular 17+, Standalone Components, angular-oauth2-oidc, Angular Signals, Jasmine/Karma para tests, Google Cloud Console para credenciales OAuth.

---

## Prerequisito: Configurar Google Cloud Console

Antes de escribir código necesitas un `clientId` real de Google.

- [ ] Ve a [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Crea un proyecto nuevo (ej: `google-auth-reference`)
- [ ] Ve a **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
- [ ] Tipo de aplicación: **Web application**
- [ ] Authorized JavaScript origins: `http://localhost:4200`
- [ ] Authorized redirect URIs: `http://localhost:4200`
- [ ] Copia el **Client ID** generado (formato: `XXXXXXXX.apps.googleusercontent.com`)
- [ ] Ve a **APIs & Services → OAuth consent screen** y configura en modo **Testing** con tu email como usuario de prueba

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/environments/environment.ts` | `googleClientId` para producción |
| `src/environments/environment.development.ts` | `googleClientId` para desarrollo |
| `src/app/core/models/auth-user.model.ts` | Tipo `AuthUser` y `AuthState` |
| `src/app/core/auth/auth.provider.ts` | Interfaz `AuthProvider` + `AUTH_PROVIDER` InjectionToken |
| `src/app/core/auth/google-oauth.provider.ts` | Implementación con `angular-oauth2-oidc` |
| `src/app/core/auth/auth.service.ts` | Orquestador: Signals, estado de sesión |
| `src/app/core/auth/auth.guard.ts` | `CanActivateFn` para rutas protegidas |
| `src/app/core/auth/auth.service.spec.ts` | Tests unitarios de AuthService |
| `src/app/core/auth/auth.guard.spec.ts` | Tests unitarios del guard |
| `src/app/pages/login/login.page.ts` | Página pública con botón Sign in |
| `src/app/pages/home/home.page.ts` | Página protegida post-login |
| `src/app/pages/profile/profile.page.ts` | Claims del id_token decodificados |
| `src/app/pages/public-demo/public-demo.page.ts` | Ruta pública de ejemplo |
| `src/app/pages/access-denied/access-denied.page.ts` | Error de acceso con `?reason=` |
| `src/app/app.routes.ts` | Definición de rutas |
| `src/app/app.config.ts` | ApplicationConfig con providers y DI token |
| `src/app/app.component.ts` | Shell con `router-outlet` y banner de error |

---

## Task 1: Scaffold del proyecto Angular

**Files:**
- Create: `src/` (estructura completa del proyecto Angular)

- [ ] **Step 1: Scaffold desde el directorio padre**

Desde `/Users/josearmandosantiagolorenzo/Developer/sandbox/`:

```bash
ng new google-auth-reference --routing=false --style=scss --standalone
```

> Si pide confirmación de SSR, responde **No**.
> El CLI detectará que la carpeta existe con `.git` y archivos — acepta sobreescribir o usa `--force` si lo pide.

- [ ] **Step 2: Instalar dependencias de auth**

```bash
cd google-auth-reference
npm install angular-oauth2-oidc
```

- [ ] **Step 3: Verificar que el proyecto arranca**

```bash
ng serve
```

Abre `http://localhost:4200` — debes ver la página de bienvenida de Angular. Cierra con `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: scaffold Angular 17 project with angular-oauth2-oidc"
```

---

## Task 2: Modelos y tipos base

**Files:**
- Create: `src/app/core/models/auth-user.model.ts`

- [ ] **Step 1: Crear directorio y modelo**

```bash
mkdir -p src/app/core/models
```

Crea `src/app/core/models/auth-user.model.ts`:

```typescript
export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
  idToken: string;
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error';
```

- [ ] **Step 2: Commit**

```bash
git add src/app/core/models/auth-user.model.ts
git commit -m "feat: add AuthUser model and AuthState type"
```

---

## Task 3: Interfaz AuthProvider e InjectionToken

**Files:**
- Create: `src/app/core/auth/auth.provider.ts`

- [ ] **Step 1: Crear directorio y archivo**

```bash
mkdir -p src/app/core/auth
```

Crea `src/app/core/auth/auth.provider.ts`:

```typescript
import { InjectionToken } from '@angular/core';
import { AuthUser } from '../models/auth-user.model';

export interface AuthProvider {
  initialize(): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): AuthUser | null;
  isAuthenticated(): boolean;
  getIdToken(): string | null;
}

export const AUTH_PROVIDER = new InjectionToken<AuthProvider>('AUTH_PROVIDER');
```

`InjectionToken` es el mecanismo de Angular para inyectar valores que no son clases. Aquí lo usamos para que Angular sepa qué implementación de `AuthProvider` entregar cuando alguien la pida.

- [ ] **Step 2: Commit**

```bash
git add src/app/core/auth/auth.provider.ts
git commit -m "feat: add AuthProvider interface and DI token (Strategy Pattern)"
```

---

## Task 4: Variables de entorno

**Files:**
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.development.ts`

Si la carpeta `src/environments/` no existe:

```bash
mkdir -p src/environments
```

- [ ] **Step 1: Crear/editar `src/environments/environment.ts`**

```typescript
export const environment = {
  production: true,
  googleClientId: 'TU_CLIENT_ID.apps.googleusercontent.com',
};
```

- [ ] **Step 2: Crear/editar `src/environments/environment.development.ts`**

```typescript
export const environment = {
  production: false,
  googleClientId: 'TU_CLIENT_ID.apps.googleusercontent.com',
};
```

Reemplaza `TU_CLIENT_ID` con el Client ID que obtuviste en Google Cloud Console.

- [ ] **Step 3: Verificar que `angular.json` tiene fileReplacements configurado**

Abre `angular.json` y busca la sección `configurations.development`. Debe tener:

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.development.ts"
  }
]
```

Si no existe, agrégala dentro de `projects.<nombre>.architect.build.configurations.development`.

- [ ] **Step 4: Commit**

```bash
git add src/environments/
git commit -m "feat: add environment files with googleClientId"
```

---

## Task 5: GoogleOAuthProvider

**Files:**
- Create: `src/app/core/auth/google-oauth.provider.ts`

- [ ] **Step 1: Crear el provider**

Crea `src/app/core/auth/google-oauth.provider.ts`:

```typescript
import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthProvider } from './auth.provider';
import { AuthUser } from '../models/auth-user.model';
import { environment } from '../../../environments/environment';

@Injectable()
export class GoogleOAuthProvider implements AuthProvider {
  constructor(private oauthService: OAuthService) {}

  async initialize(): Promise<void> {
    this.oauthService.configure({
      issuer: 'https://accounts.google.com',
      redirectUri: window.location.origin,
      clientId: environment.googleClientId,
      scope: 'openid profile email',
      strictDiscoveryDocumentValidation: false,
    });
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  async signInWithGoogle(): Promise<void> {
    this.oauthService.initCodeFlow();
  }

  async signOut(): Promise<void> {
    this.oauthService.logOut();
  }

  getCurrentUser(): AuthUser | null {
    if (!this.oauthService.hasValidIdToken()) return null;
    const claims = this.oauthService.getIdentityClaims() as Record<string, string>;
    return {
      sub: claims['sub'],
      email: claims['email'],
      name: claims['name'],
      picture: claims['picture'],
      idToken: this.oauthService.getIdToken(),
    };
  }

  isAuthenticated(): boolean {
    return this.oauthService.hasValidIdToken();
  }

  getIdToken(): string | null {
    return this.oauthService.getIdToken() || null;
  }
}
```

> `strictDiscoveryDocumentValidation: false` es necesario porque el Discovery Document de Google no cumple exactamente el spec OIDC (algunos campos opcionales están ausentes). Con Firebase o IdentityServer esto no sería necesario.

- [ ] **Step 2: Commit**

```bash
git add src/app/core/auth/google-oauth.provider.ts
git commit -m "feat: implement GoogleOAuthProvider with angular-oauth2-oidc"
```

---

## Task 6: AuthService con Signals

**Files:**
- Create: `src/app/core/auth/auth.service.ts`
- Create: `src/app/core/auth/auth.service.spec.ts`

- [ ] **Step 1: Escribir el test primero**

Crea `src/app/core/auth/auth.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
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
  initialize: jasmine.createSpy('initialize').and.resolveTo(),
  signInWithGoogle: jasmine.createSpy('signInWithGoogle').and.resolveTo(),
  signOut: jasmine.createSpy('signOut').and.resolveTo(),
  getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
  isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
  getIdToken: jasmine.createSpy('getIdToken').and.returnValue(null),
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
      getCurrentUser: jasmine.createSpy().and.returnValue(mockUser),
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
    });
    await service.initialize();
    expect(service.authState()).toBe('authenticated');
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should set state to unauthenticated when no token', async () => {
    setup();
    await service.initialize();
    expect(service.authState()).toBe('unauthenticated');
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should set state to error when initialize throws', async () => {
    setup({
      initialize: jasmine.createSpy().and.rejectWith(new Error('Network error')),
    });
    await service.initialize();
    expect(service.authState()).toBe('error');
  });

  it('should clear currentUser and set unauthenticated on signOut', async () => {
    setup({
      getCurrentUser: jasmine.createSpy().and.returnValue(mockUser),
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
    });
    await service.initialize();
    await service.signOut();
    expect(service.currentUser()).toBeNull();
    expect(service.authState()).toBe('unauthenticated');
  });
});
```

- [ ] **Step 2: Ejecutar el test — debe fallar**

```bash
ng test --include="**/auth.service.spec.ts" --watch=false
```

Esperado: `ERROR: AuthService not found` o similar. El test falla porque el servicio no existe aún.

- [ ] **Step 3: Implementar AuthService**

Crea `src/app/core/auth/auth.service.ts`:

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { AUTH_PROVIDER } from './auth.provider';
import { AuthState, AuthUser } from '../models/auth-user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private provider = inject(AUTH_PROVIDER);

  readonly currentUser = signal<AuthUser | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly authState = signal<AuthState>('loading');

  async initialize(): Promise<void> {
    try {
      await this.provider.initialize();
      this.currentUser.set(this.provider.getCurrentUser());
      this.authState.set(this.provider.isAuthenticated() ? 'authenticated' : 'unauthenticated');
    } catch {
      this.authState.set('error');
    }
  }

  async signInWithGoogle(): Promise<void> {
    await this.provider.signInWithGoogle();
  }

  async signOut(): Promise<void> {
    await this.provider.signOut();
    this.currentUser.set(null);
    this.authState.set('unauthenticated');
  }
}
```

- [ ] **Step 4: Ejecutar el test — debe pasar**

```bash
ng test --include="**/auth.service.spec.ts" --watch=false
```

Esperado: `4 specs, 0 failures`.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/auth.service.ts src/app/core/auth/auth.service.spec.ts
git commit -m "feat: add AuthService with Signals (TDD)"
```

---

## Task 7: AuthGuard

**Files:**
- Create: `src/app/core/auth/auth.guard.ts`
- Create: `src/app/core/auth/auth.guard.spec.ts`

- [ ] **Step 1: Escribir el test primero**

Crea `src/app/core/auth/auth.guard.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AUTH_PROVIDER } from './auth.provider';

const mockAuthProvider = {
  initialize: jasmine.createSpy().and.resolveTo(),
  signInWithGoogle: jasmine.createSpy().and.resolveTo(),
  signOut: jasmine.createSpy().and.resolveTo(),
  getCurrentUser: jasmine.createSpy().and.returnValue(null),
  isAuthenticated: jasmine.createSpy().and.returnValue(false),
  getIdToken: jasmine.createSpy().and.returnValue(null),
};

describe('authGuard', () => {
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_PROVIDER, useValue: mockAuthProvider },
        provideRouter([]),
      ],
    });
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  const runGuard = (url = '/home') =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
    );

  it('should allow access when user is logged in', async () => {
    const user = { sub: '1', email: 'a@b.com', name: 'A', picture: '', idToken: 'tok' };
    authService.currentUser.set(user);
    const result = await Promise.resolve(runGuard());
    expect(result).toBeTrue();
  });

  it('should redirect to /access-denied when not logged in', async () => {
    authService.currentUser.set(null);
    const result = runGuard('/home');
    expect(result).not.toBeTrue();
  });
});
```

- [ ] **Step 2: Ejecutar el test — debe fallar**

```bash
ng test --include="**/auth.guard.spec.ts" --watch=false
```

Esperado: `ERROR: authGuard not found`.

- [ ] **Step 3: Implementar el guard**

Crea `src/app/core/auth/auth.guard.ts`:

```typescript
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
```

- [ ] **Step 4: Ejecutar el test — debe pasar**

```bash
ng test --include="**/auth.guard.spec.ts" --watch=false
```

Esperado: `2 specs, 0 failures`.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/auth.guard.ts src/app/core/auth/auth.guard.spec.ts
git commit -m "feat: add authGuard functional guard (TDD)"
```

---

## Task 8: App config y rutas

**Files:**
- Modify: `src/app/app.config.ts`
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1: Editar `src/app/app.routes.ts`**

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/public-demo/public-demo.page').then((m) => m.PublicDemoPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./pages/access-denied/access-denied.page').then((m) => m.AccessDeniedPage),
  },
  { path: '**', redirectTo: '' },
];
```

- [ ] **Step 2: Editar `src/app/app.config.ts`**

```typescript
import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { routes } from './app.routes';
import { AUTH_PROVIDER } from './core/auth/auth.provider';
import { GoogleOAuthProvider } from './core/auth/google-oauth.provider';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideOAuthClient(),
    { provide: AUTH_PROVIDER, useClass: GoogleOAuthProvider },
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.initialize(),
      deps: [AuthService],
      multi: true,
    },
  ],
};
```

> Para cambiar de Google a otro proveedor en Fase 2: cambia solo `useClass: GoogleOAuthProvider` por `useClass: FirebaseAuthProvider`.

- [ ] **Step 3: Commit**

```bash
git add src/app/app.config.ts src/app/app.routes.ts
git commit -m "feat: configure app providers and lazy-loaded routes"
```

---

## Task 9: AppComponent (shell)

**Files:**
- Modify: `src/app/app.component.ts`

- [ ] **Step 1: Editar `src/app/app.component.ts`**

```typescript
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
export class AppComponent {
  auth = inject(AuthService);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/app.component.ts
git commit -m "feat: add app shell with nav and error banner"
```

---

## Task 10: LoginPage

**Files:**
- Create: `src/app/pages/login/login.page.ts`

- [ ] **Step 1: Crear directorio y página**

```bash
mkdir -p src/app/pages/login
```

Crea `src/app/pages/login/login.page.ts`:

```typescript
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
      this.router.navigate(['/home']);
    }
  }

  signIn() {
    this.auth.signInWithGoogle();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pages/login/login.page.ts
git commit -m "feat: add LoginPage with Google sign-in button"
```

---

## Task 11: HomePage

**Files:**
- Create: `src/app/pages/home/home.page.ts`

- [ ] **Step 1: Crear directorio y página**

```bash
mkdir -p src/app/pages/home
```

Crea `src/app/pages/home/home.page.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pages/home/home.page.ts
git commit -m "feat: add HomePage with user info"
```

---

## Task 12: ProfilePage (claims del id_token)

**Files:**
- Create: `src/app/pages/profile/profile.page.ts`

- [ ] **Step 1: Crear directorio y página**

```bash
mkdir -p src/app/pages/profile
```

Crea `src/app/pages/profile/profile.page.ts`:

```typescript
import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
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
```

> `atob(token.split('.')[1])` decodifica el payload Base64 del JWT sin necesidad de librerías externas. El tercer segmento (firma) no se decodifica aquí porque requeriría las claves públicas de Google para verificarla.

- [ ] **Step 2: Agregar `JsonPipe` al import**

El template usa `| json`. Asegúrate de importar `JsonPipe`:

```typescript
import { JsonPipe } from '@angular/common';
// ...
imports: [JsonPipe],
```

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/profile/profile.page.ts
git commit -m "feat: add ProfilePage with decoded JWT claims"
```

---

## Task 13: PublicDemoPage y AccessDeniedPage

**Files:**
- Create: `src/app/pages/public-demo/public-demo.page.ts`
- Create: `src/app/pages/access-denied/access-denied.page.ts`

- [ ] **Step 1: Crear PublicDemoPage**

```bash
mkdir -p src/app/pages/public-demo
```

Crea `src/app/pages/public-demo/public-demo.page.ts`:

```typescript
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
```

- [ ] **Step 2: Crear AccessDeniedPage**

```bash
mkdir -p src/app/pages/access-denied
```

Crea `src/app/pages/access-denied/access-denied.page.ts`:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/public-demo/ src/app/pages/access-denied/
git commit -m "feat: add PublicDemoPage and AccessDeniedPage"
```

---

## Task 14: Verificación end-to-end

- [ ] **Step 1: Ejecutar todos los tests**

```bash
ng test --watch=false
```

Esperado: todos los specs pasan, 0 failures.

- [ ] **Step 2: Arrancar el servidor de desarrollo**

```bash
ng serve
```

- [ ] **Step 3: Verificar flujo completo manualmente**

1. Abre `http://localhost:4200` — debes ver PublicDemoPage con enlace a login
2. Navega a `http://localhost:4200/home` — el guard debe redirigirte a `/access-denied?reason=unauthorized`
3. Ve a `/login` — debe mostrar el botón "Sign in with Google"
4. Haz click en el botón — debe redirigirte a Google
5. Completa el login con tu cuenta (debe estar en la lista de testers del OAuth consent screen)
6. Google redirige a `http://localhost:4200` con el código en la URL
7. La app procesa el callback y navega a `/home` automáticamente
8. En `/home` debes ver tu nombre, foto y email
9. Ve a `/profile` — debes ver el header, payload decodificados y el token raw
10. Haz click en "Cerrar sesión" — debes volver a estado no autenticado

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "feat: complete Google OAuth reference app v1"
```
