# Dependency Security Audit

Date: 2026-07-26

`npm audit --json` reports 17 high-severity package findings and zero critical
findings.

## Classification

- ESLint, its plugins, `minimatch`, `brace-expansion`, and `js-yaml`: development
  lint/tooling graph. They do not ship in the application worker.
- `@opennextjs/cloudflare`, `@opennextjs/aws`, `@node-minify/core`, and `glob`:
  build/deployment tooling. The suggested audit resolution is an incompatible
  downgrade and was not applied.
- `postcss`: build-time CSS processing. Branzzo does not accept untrusted CSS or
  source maps at runtime.
- `next` / `sharp`: production image-processing path. The report flags the current
  Sharp/libvips chain and offers only a major/incompatible Next resolution. Because
  creator-controlled profile images can reach the image pipeline, this remains a
  potentially reachable high-severity production finding.

No `npm audit fix --force` was run. No safe non-breaking resolution was offered by
npm for the production image chain. Deployment remains blocked pending an upstream
patched compatible Next/Sharp release or an architecture-level mitigation that is
validated by the production build.
