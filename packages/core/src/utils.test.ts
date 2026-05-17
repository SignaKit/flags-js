import { describe, it, expect } from 'vitest'
import { parseSdkKey, sanitizeAttributes } from './utils'
import {
  MAX_ATTRIBUTES_COUNT,
  MAX_ATTRIBUTE_KEY_LENGTH,
  MAX_ATTRIBUTE_VALUE_LENGTH,
} from './constants'

// --- parseSdkKey ---

describe('parseSdkKey', () => {
  it('parses a valid development key', () => {
    const result = parseSdkKey('sk_dev_orgABC_proj123_randXYZ')
    expect(result).toEqual({
      orgId: 'orgABC',
      projectId: 'proj123',
      environment: 'development',
    })
  })

  it('parses a valid production key', () => {
    const result = parseSdkKey('sk_prod_orgABC_proj123_randXYZ')
    expect(result).toEqual({
      orgId: 'orgABC',
      projectId: 'proj123',
      environment: 'production',
    })
  })

  it('throws when the prefix is not "sk"', () => {
    expect(() => parseSdkKey('pk_dev_org_proj_rand')).toThrow('[SignaKit] Invalid SDK key format')
  })

  it('throws when there are fewer than 5 underscore-separated parts', () => {
    expect(() => parseSdkKey('sk_dev_org_proj')).toThrow('[SignaKit] Invalid SDK key format')
  })

  it('throws for an unknown environment value', () => {
    expect(() => parseSdkKey('sk_staging_org_proj_rand')).toThrow(
      '[SignaKit] Invalid SDK key environment'
    )
  })

  it('throws for an empty string', () => {
    expect(() => parseSdkKey('')).toThrow('[SignaKit] Invalid SDK key format')
  })
})

// --- sanitizeAttributes ---

describe('sanitizeAttributes', () => {
  it('returns undefined for undefined input', () => {
    expect(sanitizeAttributes(undefined)).toBeUndefined()
  })

  it('returns undefined for an empty object', () => {
    expect(sanitizeAttributes({})).toBeUndefined()
  })

  it('passes through attributes that are within all limits', () => {
    const attrs = { plan: 'premium', age: 30, verified: true }
    expect(sanitizeAttributes(attrs)).toEqual(attrs)
  })

  it('truncates attribute keys that exceed MAX_ATTRIBUTE_KEY_LENGTH', () => {
    const longKey = 'k'.repeat(MAX_ATTRIBUTE_KEY_LENGTH + 50)
    const result = sanitizeAttributes({ [longKey]: 'value' })
    const keys = Object.keys(result!)
    expect(keys[0]).toHaveLength(MAX_ATTRIBUTE_KEY_LENGTH)
  })

  it('truncates string values that exceed MAX_ATTRIBUTE_VALUE_LENGTH', () => {
    const longValue = 'v'.repeat(MAX_ATTRIBUTE_VALUE_LENGTH + 50)
    const result = sanitizeAttributes({ key: longValue })
    expect((result!['key'] as string)).toHaveLength(MAX_ATTRIBUTE_VALUE_LENGTH)
  })

  it('limits the number of attributes to MAX_ATTRIBUTES_COUNT', () => {
    const attrs: Record<string, string> = {}
    for (let i = 0; i < MAX_ATTRIBUTES_COUNT + 10; i++) {
      attrs[`key${i}`] = `value${i}`
    }
    const result = sanitizeAttributes(attrs)
    expect(Object.keys(result!)).toHaveLength(MAX_ATTRIBUTES_COUNT)
  })

  it('truncates strings within array values', () => {
    const longItem = 'x'.repeat(MAX_ATTRIBUTE_VALUE_LENGTH + 10)
    const result = sanitizeAttributes({ tags: [longItem, 'short'] })
    const tags = result!['tags'] as string[]
    expect(tags[0]).toHaveLength(MAX_ATTRIBUTE_VALUE_LENGTH)
    expect(tags[1]).toBe('short')
  })

  it('passes through numeric and boolean values unchanged', () => {
    const result = sanitizeAttributes({ score: 99, active: false })
    expect(result!['score']).toBe(99)
    expect(result!['active']).toBe(false)
  })

  it('drops attributes with undefined values', () => {
    const result = sanitizeAttributes({ defined: 'yes', missing: undefined })
    expect(result!['defined']).toBe('yes')
    expect('missing' in result!).toBe(false)
  })
})
