# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
ng serve                              # dev server en http://localhost:4200
ng build --configuration development  # build de desarrollo
ng build                              # build de producción
npx vitest run                        # todos los tests
npx vitest run src/app/core/auth/auth.service.spec.ts  # test individual
```

> `npm test` lanza el builder de Angular pero los tests corren con **Vitest** (no Karma). Usar siempre `npx vitest run` directamente.

## Arquitectura

### Strategy Pattern — núcleo de auth

`AuthService` nunca importa `GoogleOAuthProvider` directamente. Depende de la interfaz `AuthProvider` inyectada via `AUTH_PROVIDER` InjectionToken. Para cambiar de proveedor: una sola línea en `app.config.ts`.

```
AUTH_PROVIDER (InjectionToken)
    └── GoogleOAuthProvider   ← implementación actual (angular-oauth2-oidc)
```

`src/app/core/auth/auth.provider.ts` — interfaz + token  
`src/app/core/auth/google-oauth.provider.ts` — implementación v1  
`src/app/core/auth/auth.service.ts` — orquestador, expone Signals  
`src/app/app.config.ts` — donde se registra el proveedor activo

### Estado reactivo

Solo Signals — sin Observables expuestos en `AuthService`:

```typescript
readonly currentUser = signal<AuthUser | null>(null);
readonly isLoggedIn  = computed(() => this.currentUser() !== null);
readonly authState   = signal<AuthState>('loading');
// AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'
```

### Bootstrap de auth

`APP_INITIALIZER` en `app.config.ts` llama `AuthService.initialize()` antes de que el router active cualquier ruta. `initialize()` delega a `GoogleOAuthProvider` que ejecuta `loadDiscoveryDocumentAndTryLogin()` — si la URL tiene el código OAuth del callback de Google, lo intercambia aquí mismo sin ruta explícita.

### Guard

`authGuard` (`CanActivateFn`) en `src/app/core/auth/auth.guard.ts` — redirige a `/access-denied?reason=unauthorized|error&returnUrl=<url>` cuando `isLoggedIn()` es false.

## Convenciones Angular 22

- **Zoneless:** `provideZonelessChangeDetection()` — no usar `provideZoneChangeDetection`
- **DI:** `inject()` dentro del cuerpo de la clase — no constructor injection
- **Control flow:** `@if`, `@for` — no `*ngIf`, `*ngFor`
- **Archivos:** el scaffold generó `app.ts` (clase `App`), no `app.component.ts`
- **Lazy loading:** todas las páginas usan `loadComponent` en `app.routes.ts`

## Configuración requerida

`src/environments/environment.development.ts` necesita un `googleClientId` real de Google Cloud Console para que el flujo OAuth funcione. El placeholder `TU_CLIENT_ID.apps.googleusercontent.com` no es funcional.

Google Cloud Console: authorized origins y redirect URI deben incluir `http://localhost:4200`.
