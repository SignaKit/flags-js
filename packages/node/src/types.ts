/**
 * @signakit/flags-node types.
 * Re-exports all shared types from core and extends SignaKitClientConfig
 * with the node-specific `scheduler` option for Next.js `after()` support.
 */
export type {
  OnReadyResult,
  UserAttributes,
  VariableValue,
  FlagVariable,
  SignaKitDecision,
  SignaKitDecisions,
  Environment,
  RuleType,
  AudienceMatchType,
  FlagStatus,
  Variation,
  VariationAllocationRange,
  VariationAllocation,
  ConditionOperator,
  AudienceCondition,
  ConfigRuleAudience,
  AllowlistEntry,
  ConfigRule,
  ConfigFlag,
  ProjectConfig,
  SignaKitEvent,
  TrackEventOptions,
} from '@signakit/flags-core'

import type { SignaKitClientConfig as BaseConfig } from '@signakit/flags-core'

export interface SignaKitClientConfig extends BaseConfig {
  /**
   * Optional scheduler for fire-and-forget event sends (e.g. exposure tracking).
   * Pass `after` from `next/server` via `@signakit/flags-node/next` so events
   * are sent after the response is flushed, preventing them from being aborted
   * by the request lifecycle.
   */
  scheduler?: (callback: () => void | Promise<void>) => void
}
