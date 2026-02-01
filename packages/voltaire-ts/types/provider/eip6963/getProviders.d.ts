/**
 * Get snapshot of all currently discovered providers
 *
 * Returns the current state of discovered providers without subscribing
 * to future updates. Note that this requires subscribe() to have been
 * called at least once to start discovery.
 *
 * @returns {import('./types.js').ProviderDetailType[]} Array of discovered providers
 * @throws {UnsupportedEnvironmentError} If not in browser
 *
 * @example
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * // Start discovery
 * const unsubscribe = EIP6963.subscribe(() => {});
 *
 * // Get current snapshot
 * const providers = EIP6963.getProviders();
 * console.log(`Found ${providers.length} wallets`);
 *
 * unsubscribe();
 * ```
 */
export function getProviders(): import("./types.js").ProviderDetailType[];
//# sourceMappingURL=getProviders.d.ts.map