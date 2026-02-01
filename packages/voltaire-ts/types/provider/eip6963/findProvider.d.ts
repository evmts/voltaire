/**
 * Find a provider by its reverse DNS identifier
 *
 * Searches the discovered providers for one matching the given rdns.
 * Note that this requires subscribe() to have been called at least once
 * to start discovery.
 *
 * @param {{ rdns: string }} options - Search options
 * @returns {import('./types.js').ProviderDetailType | undefined} Matching provider or undefined
 * @throws {UnsupportedEnvironmentError} If not in browser
 * @throws {InvalidArgumentError} If options.rdns is missing
 *
 * @example
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * // Start discovery
 * const unsubscribe = EIP6963.subscribe(() => {});
 *
 * // Find MetaMask
 * const metamask = EIP6963.findProvider({ rdns: 'io.metamask' });
 * if (metamask) {
 *   const accounts = await metamask.provider.request({
 *     method: 'eth_requestAccounts'
 *   });
 *   console.log('Connected:', accounts[0]);
 * }
 *
 * unsubscribe();
 * ```
 */
export function findProvider(options: {
    rdns: string;
}): import("./types.js").ProviderDetailType | undefined;
//# sourceMappingURL=findProvider.d.ts.map