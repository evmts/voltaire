/**
 * EIP-6963: Multi Injected Provider Discovery
 *
 * Enables dapps to discover multiple wallet providers and wallets to announce themselves.
 *
 * ## Dapp Usage (Consumer)
 *
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * // Subscribe to wallet announcements
 * const unsubscribe = EIP6963.subscribe((providers) => {
 *   for (const { info, provider } of providers) {
 *     console.log(`Found: ${info.name} (${info.rdns})`);
 *   }
 * });
 *
 * // Find specific wallet
 * const metamask = EIP6963.findProvider({ rdns: 'io.metamask' });
 *
 * // Cleanup
 * unsubscribe();
 * ```
 *
 * ## Wallet Usage (Producer)
 *
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * const unsubscribe = EIP6963.announce({
 *   info: {
 *     uuid: crypto.randomUUID(),
 *     name: "My Wallet",
 *     icon: "data:image/svg+xml;base64,PHN2Zy...",
 *     rdns: "com.mywallet"
 *   },
 *   provider: myProvider
 * });
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 * @module provider/eip6963
 */
export { announce } from "./announce.js";
export { EIP6963Error, InvalidArgumentError, InvalidFieldError, InvalidIconError, InvalidProviderError, InvalidRdnsError, InvalidUuidError, MissingFieldError, NotImplementedError, UnsupportedEnvironmentError, } from "./errors.js";
export { findProvider } from "./findProvider.js";
export { assertBrowser, getPlatform } from "./getPlatform.js";
export { getProviders } from "./getProviders.js";
export { ProviderDetail } from "./ProviderDetail.js";
export { ProviderInfo } from "./ProviderInfo.js";
export { reset as _reset } from "./state.js";
export { subscribe } from "./subscribe.js";
export type { Platform, ProviderDetailInput, ProviderDetailType, ProviderInfoInput, ProviderInfoType, ProviderListener, } from "./types.js";
export { DATA_URI_REGEX, RDNS_REGEX, UUID_V4_REGEX, validateIcon, validateName, validateProvider, validateRdns, validateUuid, } from "./validators.js";
//# sourceMappingURL=index.d.ts.map