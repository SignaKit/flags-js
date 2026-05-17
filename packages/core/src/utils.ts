import type { Environment, UserAttributes } from './types'
import {
  MAX_ATTRIBUTES_COUNT,
  MAX_ATTRIBUTE_KEY_LENGTH,
  MAX_ATTRIBUTE_VALUE_LENGTH,
} from './constants'

/**
 * Parse an SDK key to extract org ID, project ID, and environment.
 *
 * SDK key format: sk_{env}_{orgId}_{projectId}_{random}
 * - env: 'dev' or 'prod'
 * - orgId: alphanumeric organization ID
 * - projectId: numeric project ID
 * - random: random suffix
 */
export function parseSdkKey(sdkKey: string): {
  orgId: string
  projectId: string
  environment: Environment
} {
  const parts = sdkKey.split('_')

  if (parts.length < 5 || parts[0] !== 'sk') {
    throw new Error(
      `[SignaKit] Invalid SDK key format. Expected: sk_{env}_{orgId}_{projectId}_{random}, got: ${sdkKey}`
    )
  }

  const envShort = parts[1]
  const orgId = parts[2]
  const projectId = parts[3]

  if (!envShort || !orgId || !projectId) {
    throw new Error(
      `[SignaKit] Invalid SDK key format. Could not extract environment, orgId, or projectId.`
    )
  }

  let environment: Environment
  if (envShort === 'dev') {
    environment = 'development'
  } else if (envShort === 'prod') {
    environment = 'production'
  } else {
    throw new Error(
      `[SignaKit] Invalid SDK key environment. Expected 'dev' or 'prod', got: ${envShort}`
    )
  }

  return { orgId, projectId, environment }
}

/**
 * Sanitize user attributes to enforce size limits before sending to the events API.
 * Truncates keys/values and limits total attribute count.
 */
export function sanitizeAttributes(
  attributes: UserAttributes | undefined
): UserAttributes | undefined {
  if (!attributes || Object.keys(attributes).length === 0) {
    return undefined
  }

  const sanitized: UserAttributes = {}
  const keys = Object.keys(attributes).slice(0, MAX_ATTRIBUTES_COUNT)

  for (const key of keys) {
    const sanitizedKey = key.slice(0, MAX_ATTRIBUTE_KEY_LENGTH)
    const value = attributes[key]

    if (value === undefined) {
      continue
    } else if (typeof value === 'string') {
      sanitized[sanitizedKey] = value.slice(0, MAX_ATTRIBUTE_VALUE_LENGTH)
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = (value as string[])
        .slice(0, 100)
        .map((v) => v.slice(0, MAX_ATTRIBUTE_VALUE_LENGTH))
    } else {
      sanitized[sanitizedKey] = value
    }
  }

  return sanitized
}
