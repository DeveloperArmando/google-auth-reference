# CI/CD con GitHub Actions + Cloudflare Pages

## Estado actual

- Rama: `feat/ci-cd-pipeline` (pendiente de push)
- Workflow de CI listo: `.github/workflows/ci.yml`
  - Dispara en PR hacia `main` o `feat/**`
  - Steps: checkout → Node 22 → npm ci → build → lint → tests
  - Status check para Branch Protection: `CI / build-and-test`

## Pendientes antes del push

1. Agregar la variable de entorno al workflow:
   - En GitHub → Settings → Secrets and variables → Actions → **Variables**
   - Nombre: `NG_APP_GOOGLE_CLIENT_ID`
   - Valor: tu Client ID real de Google Cloud Console
   - Luego agregar al step `Build` en `ci.yml`:
     ```yaml
     - name: Build
       run: npm run build
       env:
         NG_APP_GOOGLE_CLIENT_ID: ${{ vars.NG_APP_GOOGLE_CLIENT_ID }}
     ```

2. Hacer push de la rama y abrir el PR:
   ```bash
   git push -u origin feat/ci-cd-pipeline
   gh pr create
   ```
   (El token de gh ya tiene scope `workflow` — se reautorizó)

## Siguiente etapa: Deploy en Cloudflare Pages

### Cómo funciona

Agregar un segundo workflow `deploy.yml` que dispara en push a `main`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NG_APP_GOOGLE_CLIENT_ID: ${{ vars.NG_APP_GOOGLE_CLIENT_ID }}
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: pages deploy dist/google-auth-reference/browser
```

### Setup requerido en Cloudflare

1. Crear proyecto en Cloudflare Pages (puede ser manual la primera vez)
2. Generar API Token en Cloudflare con permiso `Cloudflare Pages: Edit`
3. Guardarlo en GitHub → Settings → Secrets → `CF_API_TOKEN`

### Diferencia Secrets vs Variables en GitHub Actions

| | Secrets | Variables |
|---|---|---|
| Uso | Credenciales, tokens, API keys | Configuración no sensible |
| En logs | Enmascarado (`***`) | Visible |
| Ejemplo aquí | `CF_API_TOKEN` | `NG_APP_GOOGLE_CLIENT_ID` |

### Patrón CI/CD final

```
PR abierto   → workflow ci.yml    → lint + tests (status check)
Merge a main → workflow deploy.yml → build + deploy a Cloudflare
```
