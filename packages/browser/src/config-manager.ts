/**
 * Config Manager
 *
 * Handles fetching and caching the config JSON from CloudFront/S3.
 * Includes automatic retry with exponential backoff for browser resilience.
 */

import { SIGNAKIT_CDN_URL } from './constants'
import { parseSdkKey } from '@signakit/flags-core'
import type { ProjectConfig, Environment } from './types'

export { parseSdkKey }

export interface ConfigManagerOptions {
  orgId: string
  projectId: string
  environment: Environment
}

export class ConfigManager {
  private config: ProjectConfig | null = null
  private etag: string | null = null
  private orgId: string
  private projectId: string
  private environment: Environment
  private pollingTimer: ReturnType<typeof setInterval> | null = null

  constructor(options: ConfigManagerOptions) {
    this.orgId = options.orgId
    this.projectId = options.projectId
    this.environment = options.environment
  }

  startPolling(intervalMs: number): void {
    if (intervalMs <= 0 || this.pollingTimer !== null) return
    this.pollingTimer = setInterval(() => {
      this._doFetch().catch(() => {
        // Polling errors are silent — stale config is better than noise
      })
    }, intervalMs)
  }

  stopPolling(): void {
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  /**
   * Get the URL for the latest config.
   */
  private getConfigUrl(): string {
    const baseUrl = SIGNAKIT_CDN_URL.replace(/\/$/, '') // Remove trailing slash
    return `${baseUrl}/configs/${this.orgId}/${this.projectId}/${this.environment}/latest.json`
  }

  /**
   * Perform the actual fetch of the config from CloudFront.
   * Uses ETag for conditional requests to avoid unnecessary data transfer.
   *
   * @returns The config
   * @throws Error if the fetch fails
   */
  private async _doFetch(): Promise<ProjectConfig> {
    const url = this.getConfigUrl()

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    // Add If-None-Match header if we have an ETag
    if (this.etag) {
      headers['If-None-Match'] = this.etag
    }

    const response = await fetch(url, { headers })

    // 304 Not Modified - return cached config
    if (response.status === 304 && this.config) {
      return this.config
    }

    // Check for errors
    if (!response.ok) {
      throw new Error(`[SignaKit] Failed to fetch config: ${response.status} ${response.statusText}`)
    }

    // Store the new ETag
    const newEtag = response.headers.get('etag')
    if (newEtag) {
      this.etag = newEtag
    }

    // Parse and store the config
    const config = (await response.json()) as ProjectConfig
    this.config = config

    return config
  }

  /**
   * Fetch the config from CloudFront with automatic retry and exponential backoff.
   * Attempts up to 4 times: immediate + 3 retries (1s, 2s, 4s delays).
   *
   * @returns The config
   * @throws Error if all attempts fail
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

  /**
   * Get the current cached config.
   *
   * @returns The cached config or null if not yet fetched
   */
  getConfig(): ProjectConfig | null {
    return this.config
  }
}

