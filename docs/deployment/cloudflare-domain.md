# Cloudflare Worker domain

The repository does not assume that a domain has been purchased or attached.

1. Deploy the `branzzo` Worker successfully.
2. In Cloudflare Workers, add the production custom domain or route.
3. Ensure the relevant DNS zone is active in the same account and HTTPS is enabled.
4. Choose one canonical host. A simple policy is to use the apex domain and redirect `www` to it at Cloudflare; document a different choice if marketing requirements change.
5. Set `NEXT_PUBLIC_APP_URL`, `BRANZZO_PUBLIC_URL`, and GitHub `PRODUCTION_URL` to the canonical HTTPS origin, without a trailing slash.
6. Rebuild and redeploy so metadata and client-side public variables contain the canonical URL.
7. Update Clerk allowed origins, sign-in/sign-up URLs, callback URLs, after-sign-in/after-sign-up routes, and webhook endpoint.
8. Confirm Open Graph images resolve from `/branding/branzzo-og.png` and email logos from `/branding/branzzo-logo.png`.
9. Run the production smoke checks against the canonical origin.

The production smoke workflow checks `/`, `/api/health`, `/favicon.ico`, `/sign-in`, and `/sign-up`. Database monitoring may separately call `/api/health/db`; it returns only a generic state and latency.
