/**
 * Config Manager
 *
 * Handles fetching and caching the config JSON from CloudFront/S3.
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

  /**
   * Get the URL for the latest config.
   */
  private getConfigUrl(): string {
    const baseUrl = SIGNAKIT_CDN_URL.replace(/\/$/, '') // Remove trailing slash
    return `${baseUrl}/configs/${this.orgId}/${this.projectId}/${this.environment}/latest.json`
  }

  /**
   * Fetch the config from CloudFront.
   * Uses ETag for conditional requests to avoid unnecessary data transfer.
   *
   * @returns The config
   * @throws Error if the fetch fails or CDN URL is not configured
   */
  async fetchConfig(): Promise<ProjectConfig> {
    const url = this.getConfigUrl()

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    // Add If-None-Match header if we have an ETag
    if (this.etag) {
      headers['If-None-Match'] = this.etag
    }

    const response = await fetch(url, { headers, cache: 'no-store' })

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
   * Get the current cached config.
   *
   * @returns The cached config or null if not yet fetched
   */
  getConfig(): ProjectConfig | null {
    return this.config
  }

  /**
   * Start polling for config updates on a fixed interval.
   * Uses ETags so a no-op poll is a lightweight conditional GET (304).
   * The timer is unref'd so it won't keep the Node.js process alive.
   */
  startPolling(intervalMs: number): void {
    if (this.pollingTimer !== null) return
    this.pollingTimer = setInterval(async () => {
      try {
        await this.fetchConfig()
      } catch {
        // Polling errors are silent — stale config is better than a crash
      }
    }, intervalMs)
    // Don't prevent Node from exiting cleanly when the app is done
    this.pollingTimer.unref()
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

