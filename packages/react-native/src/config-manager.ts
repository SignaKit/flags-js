/**
 * Config Manager for React Native.
 *
 * Fetches the project config JSON from CloudFront/S3 with retry + ETag
 * support. Optionally persists the last good config to AsyncStorage so the
 * app can boot offline-tolerant.
 */

import {
  SIGNAKIT_CDN_URL,
  ASYNC_STORAGE_CONFIG_PREFIX,
  ASYNC_STORAGE_ETAG_PREFIX,
} from './constants'
import { parseSdkKey } from '@signakit/flags-core'
import type { AsyncStorageLike, Environment, ProjectConfig } from './types'

export { parseSdkKey }

export interface ConfigManagerOptions {
  orgId: string
  projectId: string
  environment: Environment
  /** If provided, the config + ETag are persisted between cold starts. */
  storage?: AsyncStorageLike | null
}

export class ConfigManager {
  private config: ProjectConfig | null = null
  private etag: string | null = null
  private orgId: string
  private projectId: string
  private environment: Environment
  private storage: AsyncStorageLike | null
  private pollingTimer: ReturnType<typeof setInterval> | null = null

  constructor(options: ConfigManagerOptions) {
    this.orgId = options.orgId
    this.projectId = options.projectId
    this.environment = options.environment
    this.storage = options.storage ?? null
  }

  private getConfigUrl(): string {
    const baseUrl = SIGNAKIT_CDN_URL.replace(/\/$/, '')
    return `${baseUrl}/configs/${this.orgId}/${this.projectId}/${this.environment}/latest.json`
  }

  private getStorageKey(): string {
    return `${ASYNC_STORAGE_CONFIG_PREFIX}${this.orgId}/${this.projectId}/${this.environment}`
  }

  private getEtagKey(): string {
    return `${ASYNC_STORAGE_ETAG_PREFIX}${this.orgId}/${this.projectId}/${this.environment}`
  }

  /**
   * Load any persisted config from AsyncStorage. Safe to call without storage
   * configured. Errors are swallowed so a corrupt cache cannot break boot.
   */
  async loadFromCache(): Promise<ProjectConfig | null> {
    if (!this.storage) return null
    try {
      const [raw, etag] = await Promise.all([
        this.storage.getItem(this.getStorageKey()),
        this.storage.getItem(this.getEtagKey()),
      ])
      if (!raw) return null
      const parsed = JSON.parse(raw) as ProjectConfig
      this.config = parsed
      if (etag) this.etag = etag
      return parsed
    } catch {
      return null
    }
  }

  private async persist(config: ProjectConfig): Promise<void> {
    if (!this.storage) return
    try {
      await this.storage.setItem(this.getStorageKey(), JSON.stringify(config))
      if (this.etag) {
        await this.storage.setItem(this.getEtagKey(), this.etag)
      }
    } catch {
      // ignore quota / serialization failures
    }
  }

  private async _doFetch(): Promise<ProjectConfig> {
    const url = this.getConfigUrl()

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    if (this.etag) {
      headers['If-None-Match'] = this.etag
    }

    const response = await fetch(url, { headers })

    if (response.status === 304 && this.config) {
      return this.config
    }

    if (!response.ok) {
      throw new Error(
        `[SignaKit] Failed to fetch config: ${response.status} ${response.statusText}`
      )
    }

    const newEtag = response.headers.get('etag')
    if (newEtag) {
      this.etag = newEtag
    }

    const config = (await response.json()) as ProjectConfig
    this.config = config

    // Fire-and-forget persist; don't block on it.
    this.persist(config).catch(() => {})

    return config
  }

  /**
   * Fetch the config from CloudFront with automatic retry and exponential backoff.
   * Attempts up to 4 times: immediate + 3 retries (1s, 2s, 4s delays).
   */
  async fetchConfig(): Promise<ProjectConfig> {
    const delays = [1000, 2000, 4000]
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        return await this._doFetch()
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]))
        }
      }
    }

    throw lastError!
  }

  getConfig(): ProjectConfig | null {
    return this.config
  }

  /**
   * Start polling for config updates. Uses `_doFetch` directly — a failed
   * background poll is silently skipped and retried on the next interval.
   */
  startPolling(intervalMs: number): void {
    if (this.pollingTimer !== null) return
    this.pollingTimer = setInterval(async () => {
      try {
        await this._doFetch()
      } catch {
        // Polling errors are silent — stale config is better than a crash
      }
    }, intervalMs)
    // Don't prevent the JS runtime from exiting when the app is done
    if (typeof this.pollingTimer === 'object' && 'unref' in this.pollingTimer) {
      (this.pollingTimer as NodeJS.Timeout).unref()
    }
  }

  /**
   * Stop the polling loop.
   */
  stopPolling(): void {
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }
}

