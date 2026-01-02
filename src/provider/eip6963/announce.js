/**
 * Announce a wallet provider (wallet side)
 *
 * Implements the wallet side of EIP-6963 discovery.
 *
 * @module provider/eip6963/announce
 */

/** @type {typeof globalThis & { addEventListener: Function; removeEventListener: Function; dispatchEvent: Function }} */
// @ts-expect-error - window exists in browser environment
const window = globalThis;

import { InvalidArgumentError } from "./errors.js";
import { assertBrowser } from "./getPlatform.js";
import { ProviderDetail } from "./ProviderDetail.js";

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
export function announce(detail) {
	// Validate environment
	assertBrowser();

	// Validate detail object exists
	if (!detail || typeof detail !== "object") {
		throw new InvalidArgumentError(
			"announce",
			"{ info, provider }",
			typeof detail,
		);
	}

	// Validate and freeze the detail (this validates all fields)
	const frozenDetail = ProviderDetail(detail);

	/**
	 * Emit the announcement event
	 */
	function emit() {
		window.dispatchEvent(
			new CustomEvent("eip6963:announceProvider", {
				detail: frozenDetail,
			}),
		);
	}

	// Announce immediately
	emit();

	// Re-announce when dapps request providers
	window.addEventListener("eip6963:requestProvider", emit);

	// Return cleanup function
	return () => {
		window.removeEventListener("eip6963:requestProvider", emit);
	};
}
