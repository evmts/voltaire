/**
 * Subscribe to wallet provider announcements
 *
 * Listens for EIP-6963 provider announcements and calls the listener
 * with the current list of discovered providers. Automatically handles
 * deduplication by UUID (same UUID updates existing entry).
 *
 * @param {import('./types.js').ProviderListener} listener - Called with providers array on each change
 * @returns {() => void} Unsubscribe function
 * @throws {UnsupportedEnvironmentError} If not in browser
 * @throws {InvalidArgumentError} If listener is not a function
 *
 * @example
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * const unsubscribe = EIP6963.subscribe((providers) => {
 *   console.log('Discovered wallets:', providers.length);
 *
 *   for (const { info, provider } of providers) {
 *     console.log(`- ${info.name} (${info.rdns})`);
 *   }
 * });
 *
 * // Later, cleanup
 * unsubscribe();
 * ```
 */
export function subscribe(listener: import("./types.js").ProviderListener): () => void;
//# sourceMappingURL=subscribe.d.ts.map