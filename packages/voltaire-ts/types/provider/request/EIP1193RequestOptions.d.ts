/**
 * EIP-1193 Request Options
 *
 * Optional configuration for provider requests.
 *
 * @module provider/request/EIP1193RequestOptions
 */
/**
 * Optional request configuration
 *
 * @example
 * ```typescript
 * const result = await provider.request(
 *   { method: 'eth_blockNumber' },
 *   { retryCount: 3, retryDelay: 1000 }
 * );
 * ```
 */
export interface EIP1193RequestOptions {
    /** Max number of retries (default: 0) */
    retryCount?: number;
    /** Base delay between retries in ms (default: 0) */
    retryDelay?: number;
    /** Request timeout in ms (optional) */
    timeout?: number;
}
//# sourceMappingURL=EIP1193RequestOptions.d.ts.map