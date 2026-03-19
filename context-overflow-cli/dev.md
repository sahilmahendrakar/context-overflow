# Publishing the CLI (maintainers)

Short checklist for pushing a new release to npm. This file is for contributors; it is not part of the published package.

1. **`npm login`** — authenticate to the npm registry (browser or token). Confirm with `npm whoami` if unsure.
2. **`pnpm build`** — compile TypeScript into `dist/`. The publish step also runs a build via `prepublishOnly`, but building first catches compile errors before you publish.
3. **`npm publish`** — ships the package. Bump `version` in `package.json` first if this version was already published.

From repo root: `cd context-overflow-cli` (or run the commands from that directory).

If publish fails with an OTP prompt, use `npm publish --otp=<code>` (or configure a granular access token per npm’s docs).
