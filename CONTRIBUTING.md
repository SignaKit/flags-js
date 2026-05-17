# Contributing to SignaKit Feature Flags JS

Thanks for your interest in contributing! This guide covers everything you need to work on the SDK packages in this monorepo.

## Table of Contents

- [Repository layout](#repository-layout)
- [Before you start](#before-you-start)
- [Setup](#setup)
- [Development workflow](#development-workflow)
  - [Running tests](#running-tests)
  - [Watching tests during development](#watching-tests-during-development)
  - [Type checking](#type-checking)
  - [Building](#building)
- [Test conventions](#test-conventions)
  - [File layout](#file-layout)
  - [What to test](#what-to-test)
  - [Updating tests when the SDK changes](#updating-tests-when-the-sdk-changes)
- [Submitting a pull request](#submitting-a-pull-request)
- [Adding a new package](#adding-a-new-package)
- [Releases](#releases)
- [License](#license)

---

## Repository layout

```
flags-js/
├── packages/
│   ├── core/         # @signakit/flags-core        — shared types, hashing, evaluation engine
│   ├── browser/      # @signakit/flags-browser      — browser SDK
│   ├── node/         # @signakit/flags-node         — Node.js / Next.js SDK
│   ├── react/        # @signakit/flags-react        — React hooks and provider
│   └── react-native/ # @signakit/flags-react-native — React Native SDK
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

`@signakit/flags-core` contains the shared evaluation engine (MurmurHash3 bucketing, flag evaluator, audience matcher, bot detection, and utilities) used by all platform SDKs. It must build before the other packages — Turborepo handles this automatically via `"dependsOn": ["^build"]`.

Dependency graph:

```
flags-core
├── flags-browser
│   └── flags-react
├── flags-node
└── flags-react-native
```

---

## Before you start

- **Node.js 24+** is required (see `.nvmrc`). Use `nvm use` to switch automatically.
- **pnpm** is the package manager for this repo. Install it with `npm install -g pnpm` if you don't have it.
- Fork the repository and create your branch from `main`.
- Keep your changes focused — one bug fix or feature per PR makes review much faster.
- Search [existing issues](https://github.com/SignaKit/flags-js/issues) before opening a new one.

---

## Setup

Install all dependencies from the repo root:

```bash
pnpm install
```

This links all workspace packages together so changes to `@signakit/flags-core` are immediately reflected in the platform SDKs without a rebuild.

---

## Development workflow

All scripts can be run from the repo root via Turborepo, or from inside an individual package directory using `pnpm` directly.

### Running tests

```bash
# All packages
pnpm turbo test

# Single package
pnpm turbo test --filter=@signakit/flags-browser

# From inside a package directory
cd packages/browser
pnpm test
```

### Watching tests during development

```bash
cd packages/browser
pnpm test:watch
```

Re-runs only the affected tests on every file save.

### Type checking

```bash
# All packages
pnpm turbo type-check

# Single package
pnpm turbo type-check --filter=@signakit/flags-node
```

### Building

```bash
# All packages (respects dependency order: core → browser/node/react-native → react)
pnpm turbo build

# Single package and its dependencies
pnpm turbo build --filter=@signakit/flags-react...
```

Every package produces dual ESM + CJS output in its `dist/` directory:
- `dist/index.mjs` — ES module build
- `dist/index.js` — CommonJS build
- `dist/index.d.ts` / `dist/index.d.mts` — TypeScript declarations

The `flags-node` package additionally builds `dist/next.mjs` / `dist/next.js` for its Next.js integration.

---

## Test conventions

### File layout

`flags-core`, `flags-browser`, and `flags-node` use Vitest. `flags-react` and `flags-react-native` use Jest with React Testing Library.

```
packages/core/src/
├── hasher.ts
├── hasher.test.ts        ← tests alongside source
├── evaluator.ts
├── evaluator.test.ts
└── ...

packages/browser/src/
├── client.ts
├── __tests__/
│   ├── client.test.ts    ← tests in __tests__ subdirectory
│   ├── evaluator.test.ts
│   └── ...
└── ...

packages/react-native/
├── src/
│   └── ...
└── __tests__/            ← tests at package root
    ├── provider.test.tsx
    └── ...
```

### What to test

**Unit tests** cover one module in isolation with all external dependencies mocked:
- Happy paths — the normal, successful flow
- Error paths — invalid input, network failures, missing config
- Edge cases — empty values, boundary conditions, missing optional fields

**Integration tests** (`integration.test.ts`) verify that the client initializes correctly and evaluates flags end-to-end with a mocked CDN response.

Never call real external APIs in tests. Use `vi.mock` / `jest.mock`, `vi.spyOn` / `jest.spyOn`, or stub `globalThis.fetch` to control network behaviour.

### Updating tests when the SDK changes

| Type of change | What to update |
|---|---|
| New public method on a client class | Add a `describe` block in the relevant `client.test.ts` |
| Change to flag evaluation logic | Update `packages/core/src/evaluator.test.ts` (canonical) |
| Change to audience matching | Update `packages/core/src/audience-matcher.test.ts` |
| Change to MurmurHash3 / bucketing | Update `packages/core/src/hasher.test.ts` and verify pinned values still match |
| New config option | Add a test case for the default value and an explicit override |
| New React hook | Add a test file in `packages/react/src/__tests__/` |
| Breaking change to the public API | Update the affected `client.test.ts` and the package `README.md` |

If a test is removed because behaviour was intentionally deleted, note it in the PR description.

---

## Submitting a pull request

1. **Run the full check locally** before pushing:
   ```bash
   pnpm turbo type-check && pnpm turbo test && pnpm turbo build
   ```
2. Make sure all tests pass. Do not open a PR with failing tests.
3. If your change affects the public API or observable behaviour, update the relevant test file(s) and the package `README.md`.
4. Keep the PR description focused on *why* the change was made — the diff already shows what files changed.
5. The GitHub Actions CI workflow runs automatically on your PR. The **Gate** check must be green before merging.

---

## Adding a new package

When adding a new package under `packages/`:

1. Create `package.json` with `"name": "@signakit/flags-{name}"`. The `packages/*` glob in `pnpm-workspace.yaml` picks it up automatically.
2. Add a `tsconfig.json` that extends `../../tsconfig.base.json`.
3. Add a `tsup.config.ts` for the build (see an existing package for reference).
4. Add a `vitest.config.ts` (or `jest.config.ts` for React Native) for tests.
5. If the package depends on `@signakit/flags-core`, add it as `"workspace:*"` in `dependencies`.
6. Turborepo picks up new packages automatically — no changes to `turbo.json` are needed unless you require a custom task pipeline.

---

## Releases

Releases are handled automatically by the CI/CD pipeline. When changes are pushed to `main`, the release workflow:

1. Detects which packages changed using path filters.
2. Publishes only the changed packages to npm (skipping any version already published — idempotent).
3. Publishes `flags-core` first; platform SDKs that depend on it wait for it to complete.

To cut a release, bump the `version` field in the relevant `package.json`(s) and merge to `main`. The workflow does the rest.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
