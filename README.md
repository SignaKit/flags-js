# SignaKit Feature Flags — JavaScript SDKs

Official JavaScript SDKs for [SignaKit Feature Flags](https://signakit.com). All SDKs fetch flag configuration from the CDN once on initialization and evaluate flags locally — no per-decision network calls.

## Packages

| Package | Version | Description |
|---|---|---|
| [`@signakit/flags-browser`](packages/browser) | ![npm](https://img.shields.io/npm/v/@signakit/flags-browser) | Browser SDK |
| [`@signakit/flags-node`](packages/node) | ![npm](https://img.shields.io/npm/v/@signakit/flags-node) | Node.js / Next.js SDK |
| [`@signakit/flags-react`](packages/react) | ![npm](https://img.shields.io/npm/v/@signakit/flags-react) | React hooks and provider |
| [`@signakit/flags-react-native`](packages/react-native) | ![npm](https://img.shields.io/npm/v/@signakit/flags-react-native) | React Native SDK |
| [`@signakit/flags-core`](packages/core) | ![npm](https://img.shields.io/npm/v/@signakit/flags-core) | Shared evaluation engine (internal) |

Each package has its own README with installation instructions, quick start, and full API reference.

## How it works

Every SDK shares the same evaluation engine from `@signakit/flags-core`:

1. **Fetch** — on initialization, the SDK fetches your project's flag configuration from the SignaKit CDN.
2. **Evaluate locally** — all flag decisions (traffic allocation, audience targeting, variation assignment) happen in-process using MurmurHash3 bucketing. No user data leaves the device.
3. **Poll** — the config is refreshed in the background on a configurable interval (default 30s) so flag changes propagate without a redeploy.

## Repository structure

```
flags-js/
├── packages/
│   ├── core/         # Shared hashing, evaluation engine, types
│   ├── browser/      # Browser SDK
│   ├── node/         # Node.js / Next.js SDK
│   ├── react/        # React hooks and provider (wraps flags-browser)
│   └── react-native/ # React Native SDK
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

`flags-core` must build before the platform SDKs — Turborepo handles this automatically.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up the repo locally, run tests, and submit a pull request.

## License

MIT — see [LICENSE](LICENSE).
