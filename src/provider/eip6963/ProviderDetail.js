/**
 * ProviderDetail constructor
 *
 * Creates a validated, branded, frozen ProviderDetail object.
 *
 * @module provider/eip6963/ProviderDetail
 */

import { brand } from "../../brand.js";
import { ProviderInfo } from "./ProviderInfo.js";
import { MissingFieldError } from "./errors.js";
import { validateProvider } from "./validators.js";

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
export function ProviderDetail(input) {
	// Validate info exists
	if (input.info === undefined || input.info === null) {
		throw new MissingFieldError("ProviderDetail", "info");
	}

	// Validate provider
	validateProvider(input.provider);

	// Create validated ProviderInfo (validates and freezes)
	const info = ProviderInfo(input.info);

	// Create branded object
	const result = /** @type {import('./types.js').ProviderDetailType} */ ({
		info,
		provider: input.provider,
	});

	// Apply brand
	Object.defineProperty(result, brand, {
		value: "ProviderDetail",
		enumerable: false,
		writable: false,
		configurable: false,
	});

	// Freeze and return
	return Object.freeze(result);
}
