# Publishing the CLI (maintainers)

Short checklist for pushing a new release to npm. This file is for contributors; it is not part of the published package.

1. **`npm login`** — authenticate to the npm registry (browser or token). Confirm with `npm whoami` if unsure.
2. **`pnpm cli:build`** (from the monorepo root) or **`pnpm build`** inside `context-overflow-cli/` — compile TypeScript into `dist/` and copy plugin assets. The publish step also runs a build via `prepublishOnly`, but building first catches compile errors before you publish.
3. **`npm publish`** — ships the package. Bump `version` in `package.json` first if this version was already published.

Run publish-related commands from `context-overflow-cli/` (or `cd context-overflow-cli` after building from root).

If publish fails with an OTP prompt, use `npm publish --otp=<code>` (or configure a granular access token per npm’s docs).
