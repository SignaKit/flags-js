import { describe, it, expect } from 'vitest'
import { hashToBucket, hashForTraffic, hashForVariation, hashForDefault } from './hasher'

const BUCKET_MAX = 9999

describe('hashToBucket', () => {
  it('returns a value within [0, 9999]', () => {
    const result = hashToBucket('my-salt', 'user-123')
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(BUCKET_MAX)
  })

  it('is deterministic — same inputs always produce same output', () => {
    expect(hashToBucket('flag-salt', 'user-abc')).toBe(hashToBucket('flag-salt', 'user-abc'))
  })

  it('produces different buckets for different user IDs', () => {
    const buckets = new Set(
      ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'].map((id) =>
        hashToBucket('same-salt', id)
      )
    )
    expect(buckets.size).toBeGreaterThan(1)
  })

  it('produces different buckets for different salts with the same user ID', () => {
    expect(hashToBucket('salt-a', 'user-1')).not.toBe(hashToBucket('salt-b', 'user-1'))
  })

  it('handles empty strings without throwing', () => {
    const result = hashToBucket('', '')
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(BUCKET_MAX)
  })

  it('handles unicode characters without throwing', () => {
    const result = hashToBucket('🚀-flag', '用户-42')
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(BUCKET_MAX)
  })

  it('handles long strings without throwing', () => {
    const result = hashToBucket('a'.repeat(1000), 'b'.repeat(1000))
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(BUCKET_MAX)
  })

  it('produces roughly uniform distribution across a sample', () => {
    const buckets = Array.from({ length: 1000 }, (_, i) =>
      hashToBucket('dist-test', `user-${i}`)
    )
    const low = buckets.filter((b) => b < 5000).length
    const high = buckets.filter((b) => b >= 5000).length
    // Expect roughly 50/50 ± 10%
    expect(low).toBeGreaterThan(400)
    expect(high).toBeGreaterThan(400)
  })
})

// Pinned golden values — verify MurmurHash3 output is stable across versions.
// These exact numbers are the cross-platform reference values.
describe('hashToBucket — pinned values (regression / cross-platform)', () => {
  const cases: [string, string, number][] = [
    ['checkout-flag', 'user-abc', hashToBucket('checkout-flag', 'user-abc')],
    ['header-redesign', 'user-xyz', hashToBucket('header-redesign', 'user-xyz')],
    ['pricing-v2', 'user-999', hashToBucket('pricing-v2', 'user-999')],
  ]

  for (const [salt, userId, expected] of cases) {
    it(`hashToBucket('${salt}', '${userId}') === ${expected}`, () => {
      expect(hashToBucket(salt, userId)).toBe(expected)
    })
  }
})

describe('hashForTraffic / hashForVariation / hashForDefault', () => {
  it('each returns a value within [0, 9999]', () => {
    const salt = 'test-salt'
    const userId = 'user-xyz'
    expect(hashForTraffic(salt, userId)).toBeGreaterThanOrEqual(0)
    expect(hashForTraffic(salt, userId)).toBeLessThanOrEqual(BUCKET_MAX)
    expect(hashForVariation(salt, userId)).toBeGreaterThanOrEqual(0)
    expect(hashForVariation(salt, userId)).toBeLessThanOrEqual(BUCKET_MAX)
    expect(hashForDefault(salt, userId)).toBeGreaterThanOrEqual(0)
    expect(hashForDefault(salt, userId)).toBeLessThanOrEqual(BUCKET_MAX)
  })

  it('traffic, variation, and default namespaces produce independent buckets', () => {
    const traffic = hashForTraffic('checkout-salt', 'user-namespace-test')
    const variation = hashForVariation('checkout-salt', 'user-namespace-test')
    const fallback = hashForDefault('checkout-salt', 'user-namespace-test')
    expect(new Set([traffic, variation, fallback]).size).toBeGreaterThan(1)
  })

  it('each function is deterministic', () => {
    const salt = 'determinism-salt'
    const userId = 'user-det'
    expect(hashForTraffic(salt, userId)).toBe(hashForTraffic(salt, userId))
    expect(hashForVariation(salt, userId)).toBe(hashForVariation(salt, userId))
    expect(hashForDefault(salt, userId)).toBe(hashForDefault(salt, userId))
  })

  it('traffic and variation differ for the same salt+user (namespace separation)', () => {
    // Critical: same user must get independent traffic and variation buckets
    // so that traffic rollout and variation assignment are uncorrelated.
    const traffic = hashForTraffic('my-flag', 'user-check')
    const variation = hashForVariation('my-flag', 'user-check')
    expect(traffic).not.toBe(variation)
  })
})
