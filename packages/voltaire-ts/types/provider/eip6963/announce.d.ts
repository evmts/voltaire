/**
 * Announce a wallet provider
 *
 * For wallet implementations: announces the provider to dapps and
 * automatically re-announces when dapps request providers.
 *
 * @param {import('./types.js').ProviderDetailInput} detail - Provider info and instance
 * @returns {() => void} Unsubscribe function to stop announcing
 * @throws {UnsupportedEnvironmentError} If not in browser
 * @throws {InvalidArgumentError} If detail is missing info or provider
 * @throws {InvalidProviderError} If provider.request is not a function
 * @throws {InvalidUuidError} If info.uuid is not valid UUIDv4
 * @throws {InvalidRdnsError} If info.rdns is not valid reverse DNS
 * @throws {InvalidIconError} If info.icon is not valid data URI
 *
 * @example
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * // In wallet extension
 * const unsubscribe = EIP6963.announce({
 *   info: {
 *     uuid: crypto.randomUUID(),
 *     name: "My Wallet",
 *     icon: "data:image/svg+xml;base64,PHN2Zy...",
 *     rdns: "com.mywallet"
 *   },
 *   provider: myProvider
 * });
 *
 * // On extension unload
 * unsubscribe();
 * ```
 */
export function announce(detail: import("./types.js").ProviderDetailInput): () => void;
//# sourceMappingURL=announce.d.ts.map