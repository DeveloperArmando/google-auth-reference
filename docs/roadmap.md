# Roadmap

## v1 — Angular + Google OAuth ✅ COMPLETA

**Objetivo:** Entender el flujo OAuth/OIDC sin backend. Establecer la arquitectura base con Strategy Pattern.

**Lo que incluye:**
- Angular 22 Standalone Components + Signals
- `angular-oauth2-oidc` como cliente OAuth
- Strategy Pattern con `AuthProvider` interface
- `authGuard` funcional
- 5 páginas: public, login, home, profile, access-denied
- ProfilePage decodifica y muestra claims del id_token JWT
- Sesión en `sessionStorage` (sin backend)
- Tests con Vitest (TDD en auth core)

**Lo que NO incluye (intencionalmente):**
- Refresh tokens (Google no los emite sin backend)
- HttpOnly cookies
- Validación del id_token en servidor
- 2FA

---

## v2 — AWS Backend (próxima)

**Objetivo:** Añadir un backend real que valide el `id_token` de Google y emita un JWT propio con claims personalizados.

**Stack planificado:**
- AWS Lambda + API Gateway
- El frontend envía el `id_token` de Google al backend
- El backend lo valida con las claves públicas de Google (`jwks_uri` del Discovery Document)
- El backend emite su propio JWT firmado con claims personalizados
- Sesión en `HttpOnly` cookie (más segura que sessionStorage)

**Cambio arquitectónico:**
Una sola línea en `app.config.ts`:
```typescript
{ provide: AUTH_PROVIDER, useClass: AWSBackedAuthProvider }
```

**Lo que agrega:**
- Refresh tokens (el backend puede emitirlos)
- Revocación de sesión desde servidor
- HttpOnly cookies (protección contra XSS)
- Claims personalizados en el JWT propio

---

## v3 — 2FA

**Objetivo:** Añadir segundo factor de autenticación sobre la base de v2.

**Prerequisito:** v2 (necesita backend para manejar el estado del segundo factor)

**Opciones a evaluar:**
- TOTP (Google Authenticator / Authy)
- SMS OTP
- WebAuthn / Passkeys
