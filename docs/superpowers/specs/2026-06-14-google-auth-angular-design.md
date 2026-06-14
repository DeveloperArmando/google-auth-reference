# Google Auth Angular Reference — Design Spec

**Fecha:** 2026-06-14  
**Versión:** 1.0 (Fase 1 de 3)  
**Objetivo:** Proyecto de referencia personal para aprender autenticación con Google OAuth usando Angular 17+ con Standalone Components. Base para futuras versiones con AWS backend y 2FA.

---

## Roadmap del proyecto

| Versión | Alcance |
|---|---|
| **v1 (este spec)** | Angular + Google OAuth, sin backend, Strategy Pattern |
| **v2** | AWS backend (Lambda + API Gateway), validación del id_token, JWT propio |
| **v3** | Doble factor de autenticación (2FA) |

---

## Stack

- **Framework:** Angular 17+ con Standalone Components (sin NgModules)
- **Librería auth:** `angular-oauth2-oidc`
- **Estado reactivo:** Angular Signals
- **Proveedor OAuth:** Google Identity (Google Cloud Console)
- **Backend:** ninguno en esta fase

---

## Arquitectura

### Estructura de carpetas

```
google-auth-reference/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── auth.provider.ts          ← interfaz AuthProvider (Strategy Pattern)
│   │   │   │   ├── google-oauth.provider.ts  ← implementación con angular-oauth2-oidc
│   │   │   │   ├── auth.service.ts           ← orquesta estado, expone Signals
│   │   │   │   └── auth.guard.ts             ← CanActivateFn funcional
│   │   │   └── models/
│   │   │       └── auth-user.model.ts        ← tipo AuthUser
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   ├── home/
│   │   │   ├── profile/
│   │   │   ├── public-demo/
│   │   │   └── access-denied/
│   │   ├── app.routes.ts
│   │   └── app.config.ts                     ← DI token para el AuthProvider activo
```

### Strategy Pattern

`AuthService` depende de la interfaz `AuthProvider`, nunca de la implementación concreta. Cambiar de proveedor requiere modificar una sola línea en `app.config.ts`.

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

**DI token en `app.config.ts`:**
```typescript
{ provide: AUTH_PROVIDER, useClass: GoogleOAuthProvider }
// Fase 2+: cambiar a FirebaseAuthProvider, SupabaseAuthProvider, etc.
```

### Modelo de usuario

```typescript
export interface AuthUser {
  sub: string;       // Google ID único
  email: string;
  name: string;
  picture: string;
  idToken: string;   // JWT raw de Google (visible en ProfilePage para aprendizaje)
}
```

### Estado reactivo con Signals

```typescript
readonly currentUser = signal<AuthUser | null>(null);
readonly isLoggedIn = computed(() => this.currentUser() !== null);
readonly authState = signal<AuthState>('loading');
// AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'
```

---

## Rutas y vistas

| Ruta | Vista | Acceso | Propósito |
|---|---|---|---|
| `/` | `PublicDemoPage` | Público | Ejemplo de ruta pública |
| `/login` | `LoginPage` | Público (redirect si logueado) | Botón Sign in with Google |
| `/home` | `HomePage` | Protegida | Primera vista post-login |
| `/profile` | `ProfilePage` | Protegida | Claims del id_token decodificados visibles |
| `/access-denied` | `AccessDeniedPage` | Público | Redirect del guard, acepta `?reason=` |

### Flujo de navegación

```
No logueado → /home → AuthGuard → /access-denied?reason=unauthorized
No logueado → /login → Google → callback → /home
Logueado → /login → redirect a /home
```

El callback de Google es manejado internamente por `angular-oauth2-oidc` via `tryLogin()` en el bootstrap — no requiere ruta explícita.

---

## Flujo de autenticación

```
app bootstrap
  └── APP_INITIALIZER llama AuthService.initialize()
        └── GoogleOAuthProvider.initialize()
              └── OAuthService.loadDiscoveryDocumentAndTryLogin()
                    ↓
          ¿URL contiene código de autorización?
                    ↓ sí (venimos del callback de Google)
          Intercambia código → id_token + access_token
                    ↓
          AuthService.currentUser signal actualizado
```

`loadDiscoveryDocumentAndTryLogin()` consulta el Discovery Document de Google (`/.well-known/openid-configuration`) que describe todos los endpoints del IdP — el mismo mecanismo estándar OIDC que usa IdentityServer.

---

## Manejo de errores

| Caso | Manejo |
|---|---|
| Usuario cancela en Google | `error=access_denied` en URL, limpiar estado, permanecer en `/login` |
| Token expirado | `isAuthenticated()` → false, guard redirige a `/access-denied?reason=expired` |
| Fallo al cargar Discovery Document | `authState` → `'error'`, banner visible en la app |
| Tab nuevo con sesión previa | `tryLogin()` recupera desde `sessionStorage` automáticamente |

**`AccessDeniedPage`** lee el query param `reason` y muestra mensaje contextual.

---

## Fuera de alcance (Fase 1)

- Refresh tokens (Google no los emite sin backend)
- Revocación de sesión desde el servidor
- Almacenamiento seguro en cookie `HttpOnly` (requiere backend — Fase 2)
- 2FA (Fase 3)

---

## Conceptos clave a entender ejecutando este proyecto

- OAuth 2.0 es el **protocolo de autorización**; JWT es el **formato del token** — son independientes
- El `id_token` que devuelve Google ES un JWT firmado por Google con claims: `sub`, `email`, `name`, `picture`, `iat`, `exp`
- Sin backend: el `id_token` de Google se usa directamente; sesión vive en `sessionStorage`
- Con backend (Fase 2): el backend valida el `id_token` y emite su propio JWT con claims personalizados
- Discovery Document: endpoint estándar OIDC que describe la configuración del IdP — mismo mecanismo en Firebase, IdentityServer, Supabase Auth
- Ecosistema de servicios: Firebase Auth, Supabase Auth, AWS Cognito, Auth0, Clerk — todos abstraen este mismo flujo
