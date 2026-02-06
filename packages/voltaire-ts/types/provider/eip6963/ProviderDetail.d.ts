/**
 * Create a validated ProviderDetail object
 *
 * Validates info and provider, then returns a frozen, branded object.
 *
 * @param {import('./types.js').ProviderDetailInput} input - Provider detail fields
 * @returns {import('./types.js').ProviderDetailType} Frozen, branded ProviderDetail
 * @throws {MissingFieldError} If info or provider is missing
 * @throws {InvalidProviderError} If provider.request is not a function
 * @throws {InvalidUuidError} If info.uuid is not valid UUIDv4
 * @throws {InvalidRdnsError} If info.rdns is not valid reverse DNS
 * @throws {InvalidIconError} If info.icon is not valid data URI
 * @throws {InvalidFieldError} If info.name is empty
 *
 * @example
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * const detail = EIP6963.ProviderDetail({
 *   info: {
 *     uuid: "350670db-19fa-4704-a166-e52e178b59d2",
 *     name: "Example Wallet",
 *     icon: "data:image/svg+xml;base64,PHN2Zy...",
 *     rdns: "com.example.wallet"
 *   },
 *   provider: window.ethereum
 * });
 *
 * // Use the provider
 * const accounts = await detail.provider.request({
 *   method: 'eth_accounts'
 * });
 * ```
 */
export function ProviderDetail(input: import("./types.js").ProviderDetailInput): import("./types.js").ProviderDetailType;
//# sourceMappingURL=ProviderDetail.d.ts.map