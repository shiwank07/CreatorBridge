# Branzzo

Branzzo is a Next.js creator collaboration platform.

## Local development

Use Node 22 and npm:

```bash
npm ci
npm run dev
```

Copy `.env.local.example` to an ignored `.env.local` file and provide only local or development credentials.

## Validation and deployment

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run cf:build
npm run preview
```

`npm run preview` builds the OpenNext Worker and starts a local Wrangler preview. `npm run deploy` deploys an already-built Worker and requires Cloudflare credentials in the environment. Normal production deployment should use the **Deploy Production** GitHub Actions workflow.

Required deployment credentials are named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Runtime application secrets are configured directly on the Worker; no secret values belong in this repository.

Workflows:

- CI
- Deploy Production
- E2E
- Run Analytics Migration
- Verify or Apply Analytics Indexes

The application liveness endpoint is `/api/health`; database readiness is `/api/health/db`.

See:

- [Environment variables](docs/deployment/environment-variables.md)
- [GitHub Actions](docs/deployment/github-actions.md)
- [Cloudflare compatibility](docs/deployment/cloudflare-compatibility.md)
- [Custom domain setup](docs/deployment/cloudflare-domain.md)
