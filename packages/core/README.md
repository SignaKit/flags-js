# @signakit/flags-core

Shared evaluation engine for the [SignaKit Feature Flags](https://signakit.com) JavaScript SDKs.

> **This package is internal.** It is consumed by the platform SDKs and not intended for direct use in application code. Install the SDK for your platform instead:
>
> | Platform | Package |
> |---|---|
> | Browser | [`@signakit/flags-browser`](https://www.npmjs.com/package/@signakit/flags-browser) |
> | Node.js / Next.js | [`@signakit/flags-node`](https://www.npmjs.com/package/@signakit/flags-node) |
> | React | [`@signakit/flags-react`](https://www.npmjs.com/package/@signakit/flags-react) |
> | React Native | [`@signakit/flags-react-native`](https://www.npmjs.com/package/@signakit/flags-react-native) |

## What's in this package

- **MurmurHash3 bucketing** — deterministic user assignment into traffic and variation buckets (0–9999)
- **Flag evaluator** — evaluates a flag or all flags for a user against the fetched project config, respecting allowlists, audience targeting, traffic allocation, and variation ranges
- **Audience matcher** — evaluates rule conditions against user attributes (`equals`, `in`, numeric comparisons, `contains`, and more)
- **Bot detection** — pre-compiled regex covering 300+ known bot user-agents across search engines, AI crawlers, monitoring tools, and HTTP libraries
- **Shared types** — TypeScript interfaces for `ProjectConfig`, `ConfigFlag`, `SignaKitDecision`, `UserAttributes`, and all related protocol types
- **Utilities** — SDK key parser and attribute sanitizer

All platform SDKs import from this package and are guaranteed to produce identical flag decisions for the same user ID, attributes, and config — regardless of runtime environment.

## License

MIT
