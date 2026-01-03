// Deep Research - Base Search Provider
// Abstract base class for all academic database providers

import type { DatabaseSource } from '../types';
import type {
  SearchProvider,
  SearchQuery,
  SearchResults,
  SearchPaper,
} from './types';

/**
 * Configuration for a search provider
 */
export interface ProviderConfig {
  name: DatabaseSource;
  displayName: string;
  description: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: {
    requestsPerSecond: number;
    burstLimit: number;
  };
  timeout: number; // ms
  retryAttempts: number;
}

/**
 * Rate limiter for API calls
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(requestsPerSecond: number, burstLimit: number) {
    this.maxTokens = burstLimit;
    this.tokens = burstLimit;
    this.refillRate = requestsPerSecond;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens <= 0) {
      const waitTime = (1 / this.refillRate) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }

    this.tokens--;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Abstract base class for search providers
 */
export abstract class BaseProvider implements SearchProvider {
  protected config: ProviderConfig;
  protected rateLimiter: RateLimiter;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(
      config.rateLimit.requestsPerSecond,
      config.rateLimit.burstLimit
    );
  }

  get name(): DatabaseSource {
    return this.config.name;
  }

  get displayName(): string {
    return this.config.displayName;
  }

  get description(): string {
    return this.config.description;
  }

  /**
   * Check if provider is available (has connectivity, valid API key, etc.)
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Execute search query
   */
  abstract search(query: SearchQuery): Promise<SearchResults>;

  /**
   * Get detailed paper information
   */
  abstract getPaperDetails(externalId: string): Promise<SearchPaper | null>;

  /**
   * Get papers that cite this paper
   */
  abstract getCitingPapers(externalId: string, limit?: number): Promise<SearchPaper[]>;

  /**
   * Get papers referenced by this paper
   */
  abstract getReferencedPapers(externalId: string, limit?: number): Promise<SearchPaper[]>;

  /**
   * Make a rate-limited HTTP request with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        await this.rateLimiter.acquire();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        // Other errors
        if (response.status >= 500) {
          lastError = new Error(`Server error: ${response.status}`);
          await this.backoff(attempt);
          continue;
        }

        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error('Request timeout');
        } else {
          lastError = error instanceof Error ? error : new Error('Unknown error');
        }
        await this.backoff(attempt);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Exponential backoff for retries
   */
  protected async backoff(attempt: number): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Generate unique ID for a paper
   */
  protected generatePaperId(externalId: string): string {
    return `${this.config.name}-${externalId}`;
  }

  /**
   * Parse author name into parts
   */
  protected parseAuthorName(name: string): { name: string; firstName?: string; lastName?: string } {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { name, lastName: parts[0] };
    }
    return {
      name,
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1],
    };
  }
}

/**
 * Provider registry for dynamic provider loading
 */
export const providerRegistry = new Map<DatabaseSource, BaseProvider>();

/**
 * Register a provider
 */
export function registerProvider(provider: BaseProvider): void {
  providerRegistry.set(provider.name, provider);
}

/**
 * Get a registered provider
 */
export function getProvider(source: DatabaseSource): BaseProvider | undefined {
  return providerRegistry.get(source);
}

/**
 * Get all available providers
 */
export async function getAvailableProviders(): Promise<BaseProvider[]> {
  const available: BaseProvider[] = [];
  for (const provider of providerRegistry.values()) {
    if (await provider.isAvailable()) {
      available.push(provider);
    }
  }
  return available;
}
