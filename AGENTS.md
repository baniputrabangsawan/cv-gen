<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CVKita Notes

- Use `pnpm`; `packageManager` is pinned to `pnpm@11.21.0` and `.npmrc` disables package-manager/version auto-management.
- Main app entrypoint is `app/page.tsx` -> `src/components/cv-app.tsx`; most UI state, autosave, import/export, theme, and locale logic live in `CVApp`.
- PDF output is rendered by `src/components/pdf-document.tsx`; browser preview is dynamically loaded from `src/components/pdf-preview.tsx` with SSR disabled.
- CV data is browser-local: IndexedDB store `cvkita-db` / `documents` in `src/lib/storage.ts`, plus `localStorage` keys `cvkita-active`, `cvkita-locale`, and `cvkita-theme`.
- Static export is intentional: `next.config.ts` has `output: "export"`; generated `.next/` and `out/` are build artifacts ignored by lint.
- `next.config.ts` sets `typescript.ignoreBuildErrors` because `pnpm build` already runs `tsc --noEmit` before `next build`; do not remove without checking restricted build environments.

# Commands

- Dev server: `pnpm dev`
- Full build: `pnpm build` (`tsc --noEmit && next build`)
- Typecheck only: `pnpm typecheck`
- Lint: `pnpm lint`
- Tests: `pnpm test`
- Focused test file: `pnpm vitest run src/lib/storage.test.ts` or `pnpm vitest run src/components/pdf-document.test.tsx`

# Testing Gotchas

- Vitest runs in `node` environment; browser-only code should stay out of tests unless the config is changed.
- PDF template coverage is in `src/components/pdf-document.test.tsx` and renders all six template IDs; update it when templates change.
- Storage/import behavior tests are in `src/lib/storage.test.ts`; update them when schema migration or backup validation changes.

# Style / Maintenance

- `src/components/editor-panel.tsx` intentionally disables Next's `no-img-element` rule for the cropped profile-photo preview.
- Keep CV schema changes synchronized across `src/types/cv.ts`, `src/lib/defaults.ts`, `src/lib/storage.ts`, `src/lib/exporters.ts`, `src/components/editor-panel.tsx`, and `src/components/pdf-document.tsx`.
- Existing code favors compact inline JSX; prefer small, local edits unless a component is actively being expanded.
