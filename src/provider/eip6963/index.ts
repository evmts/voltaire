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

// Types
export type {
	ProviderInfoType,
	ProviderInfoInput,
	ProviderDetailType,
	ProviderDetailInput,
	ProviderListener,
	Platform,
} from "./types.js";

// Errors
export {
	EIP6963Error,
	UnsupportedEnvironmentError,
	InvalidUuidError,
	InvalidRdnsError,
	InvalidIconError,
	MissingFieldError,
	InvalidFieldError,
	InvalidProviderError,
	InvalidArgumentError,
	NotImplementedError,
} from "./errors.js";

// Constructors
export { ProviderInfo } from "./ProviderInfo.js";
export { ProviderDetail } from "./ProviderDetail.js";

// Dapp API
export { subscribe } from "./subscribe.js";
export { getProviders } from "./getProviders.js";
export { findProvider } from "./findProvider.js";

// Wallet API
export { announce } from "./announce.js";

// Utilities
export { getPlatform, assertBrowser } from "./getPlatform.js";

// Validation (exported for advanced use)
export {
	validateUuid,
	validateRdns,
	validateIcon,
	validateProvider,
	validateName,
	UUID_V4_REGEX,
	RDNS_REGEX,
	DATA_URI_REGEX,
} from "./validators.js";

// State management (for testing)
export { reset as _reset } from "./state.js";
