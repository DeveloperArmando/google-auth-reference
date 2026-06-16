# Architecture — google-auth-reference

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Angular 22, Standalone Components (sin NgModules) |
| Auth library | `angular-oauth2-oidc` |
| Estado reactivo | Angular Signals (`signal`, `computed`) |
| Proveedor OAuth | Google Identity (OIDC) |
| Test runner | Vitest |
| Backend | Ninguno (v1) |

---

## Patrón central: Strategy Pattern

`AuthService` depende de la interfaz `AuthProvider` inyectada via `AUTH_PROVIDER` InjectionToken — nunca de la implementación concreta. Cambiar de proveedor requiere modificar **una sola línea** en `app.config.ts`.

```
AuthService
    └── inject(AUTH_PROVIDER)
              └── GoogleOAuthProvider   ← v1
              └── AWSCognitoProvider    ← v2 (futuro)
              └── FirebaseAuthProvider  ← posible alternativa
```

### Interfaz AuthProvider

```typescript
export interface AuthProvider {
  initialize(): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): AuthUser | null;
  isAuthenticated(): boolean;
  getIdToken(): string | null;
}
```

Para cambiar de proveedor en `app.config.ts`:
```typescript
{ provide: AUTH_PROVIDER, useClass: GoogleOAuthProvider }  // ← solo esta línea cambia
```

---

## Estado reactivo con Signals

```typescript
// AuthService
readonly currentUser = signal<AuthUser | null>(null);
readonly isLoggedIn  = computed(() => this.currentUser() !== null);
readonly authState   = signal<AuthState>('loading');

// AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'
```

Los componentes consumen los signals directamente — sin `async pipe`, sin `subscribe`.

---

## Flujo de autenticación (v1)

```
app bootstrap
  └── APP_INITIALIZER → AuthService.initialize()
        └── GoogleOAuthProvider.initialize()
              └── OAuthService.loadDiscoveryDocumentAndTryLogin()
                    ↓
          ¿URL contiene código OAuth?
                    ↓ sí (venimos del callback de Google)
          Intercambia código → id_token + access_token
                    ↓
          AuthService.currentUser signal actualizado
                    ↓
          Router activa la ruta destino
```

El callback de Google es manejado por `angular-oauth2-oidc` internamente — no requiere ruta explícita en `app.routes.ts`.

---

## Estructura de carpetas

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.provider.ts          ← interfaz + InjectionToken
│   │   ├── google-oauth.provider.ts  ← implementación v1
│   │   ├── auth.service.ts           ← orquestador, expone Signals
│   │   ├── auth.service.spec.ts
│   │   ├── auth.guard.ts             ← CanActivateFn funcional
│   │   └── auth.guard.spec.ts
│   └── models/
│       └── auth-user.model.ts        ← AuthUser, AuthState
└── pages/
    ├── login/
    ├── home/
    ├── profile/                      ← decodifica JWT claims en browser
    ├── public-demo/
    └── access-denied/                ← lee ?reason= query param
```

---

## Rutas

| Ruta | Guard | Página |
|---|---|---|
| `/` | — | PublicDemoPage |
| `/login` | — | LoginPage (redirect a /home si ya autenticado) |
| `/home` | `authGuard` | HomePage |
| `/profile` | `authGuard` | ProfilePage |
| `/access-denied` | — | AccessDeniedPage (`?reason=unauthorized\|expired\|error`) |

Todas las páginas usan **lazy loading** (`loadComponent`).

---

## Decisiones técnicas relevantes

| Decisión | Razón |
|---|---|
| `strictDiscoveryDocumentValidation: false` | El Discovery Document de Google omite campos opcionales del spec OIDC |
| `provideZonelessChangeDetection()` | Angular 22 es zoneless por defecto; Signals no necesitan Zone.js |
| `sessionStorage` para la sesión | Sin backend no hay alternativa segura; v2 usará HttpOnly cookies |
| `inject()` en lugar de constructor DI | Patrón moderno Angular 17+ para componentes standalone |
| Vitest como test runner | Default de Angular 22; reemplaza Karma/Jasmine |

---

## Modelo de usuario

```typescript
export interface AuthUser {
  sub: string;      // Google ID único
  email: string;
  name: string;
  picture: string;
  idToken: string;  // JWT raw de Google (visible en ProfilePage para aprendizaje)
}
```

El `id_token` es un JWT firmado por Google. `ProfilePage` lo decodifica en browser con `atob()` para visualizar header y payload — solo con fines educativos. La firma (tercer segmento) requeriría las claves públicas de Google para verificarse.
