/**
 * @signakit/flags-react-native types.
 * Re-exports all shared types from core and extends SignaKitClientConfig
 * and OnReadyResult with React Native-specific fields.
 */
export type {
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

import type {
  SignaKitClientConfig as BaseConfig,
  OnReadyResult as BaseOnReadyResult,
} from '@signakit/flags-core'

export interface SignaKitClientConfig extends BaseConfig {
  /**
   * If true, the latest successfully fetched config is persisted to
   * AsyncStorage and re-used on cold start when the network is unavailable.
   * Requires `@react-native-async-storage/async-storage` to be installed.
   * Defaults to `false`.
   */
  persistConfig?: boolean
}

export interface OnReadyResult extends BaseOnReadyResult {
  /** True if the ready state was satisfied via the persisted AsyncStorage cache. */
  fromCache?: boolean
}

/**
 * Minimal AsyncStorage interface used by the SDK. Compatible with
 * `@react-native-async-storage/async-storage`.
 */
export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
