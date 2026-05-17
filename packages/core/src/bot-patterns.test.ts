import { describe, it, expect } from 'vitest'
import { isBot } from './bot-patterns'

describe('isBot', () => {
  it('returns false for undefined', () => {
    expect(isBot(undefined)).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isBot('')).toBe(false)
  })

  // Search engines
  it('detects Googlebot', () => {
    expect(
      isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
    ).toBe(true)
  })

  it('detects Bingbot', () => {
    expect(
      isBot('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')
    ).toBe(true)
  })

  it('detects DuckDuckBot', () => {
    expect(isBot('DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)')).toBe(true)
  })

  // AI crawlers
  it('detects GPTBot', () => {
    expect(isBot('Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.0)')).toBe(true)
  })

  it('detects ClaudeBot', () => {
    expect(isBot('claudebot')).toBe(true)
  })

  it('detects PerplexityBot', () => {
    expect(isBot('PerplexityBot/1.0')).toBe(true)
  })

  // Social media
  it('detects FacebookExternalHit', () => {
    expect(isBot('facebookexternalhit/1.1')).toBe(true)
  })

  it('detects Twitterbot', () => {
    expect(isBot('Twitterbot/1.0')).toBe(true)
  })

  it('detects LinkedInBot', () => {
    expect(isBot('LinkedInBot/1.0 (compatible; Mozilla/5.0)')).toBe(true)
  })

  // SEO tools
  it('detects AhrefsBot', () => {
    expect(isBot('Mozilla/5.0 (compatible; AhrefsBot/7.0)')).toBe(true)
  })

  it('detects SemrushBot', () => {
    expect(isBot('Mozilla/5.0 (compatible; SemrushBot/7)')).toBe(true)
  })

  // Monitoring
  it('detects UptimeRobot', () => {
    expect(isBot('Mozilla/5.0 (compatible; UptimeRobot/2.0)')).toBe(true)
  })

  it('detects Pingdom', () => {
    expect(isBot('Pingdom.com_bot_version_1.4')).toBe(true)
  })

  // HTTP libraries
  it('detects python-requests', () => {
    expect(isBot('python-requests/2.28.0')).toBe(true)
  })

  it('detects curl', () => {
    expect(isBot('curl/7.85.0')).toBe(true)
  })

  // Headless browsers
  it('detects HeadlessChrome', () => {
    expect(
      isBot(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/109.0.5414.0 Safari/537.36'
      )
    ).toBe(true)
  })

  it('detects Selenium via generic pattern', () => {
    expect(isBot('selenium')).toBe(true)
  })

  // Generic patterns
  it('detects user-agents containing "spider"', () => {
    expect(isBot('MyCustomSpider/1.0')).toBe(true)
  })

  it('detects user-agents containing "crawl"', () => {
    expect(isBot('SomeCrawler/2.0')).toBe(true)
  })

  it('detects user-agents containing "bot/"', () => {
    expect(isBot('somebot/1.0')).toBe(true)
  })

  // Case insensitivity
  it('is case-insensitive', () => {
    expect(isBot('GOOGLEBOT')).toBe(true)
    expect(isBot('Googlebot')).toBe(true)
    expect(isBot('googlebot')).toBe(true)
  })

  // Real browser user agents — should NOT be detected as bots
  it('does not flag Chrome on Windows', () => {
    expect(
      isBot(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )
    ).toBe(false)
  })

  it('does not flag Firefox on macOS', () => {
    expect(
      isBot(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
      )
    ).toBe(false)
  })

  it('does not flag Safari on iPhone', () => {
    expect(
      isBot(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      )
    ).toBe(false)
  })

  it('does not flag a custom mobile app UA without bot signals', () => {
    expect(isBot('MyApp/3.2.1 (iOS 17.0; iPhone14,3)')).toBe(false)
  })
})
