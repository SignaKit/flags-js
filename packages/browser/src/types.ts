/**
 * @signakit/flags-browser types.
 * Re-exports all shared types from core. The browser SDK uses the base
 * SignaKitClientConfig (sdkKey + pollingInterval) without any extensions.
 */
export type {
  SignaKitClientConfig,
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
