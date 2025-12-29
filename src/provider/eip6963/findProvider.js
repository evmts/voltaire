/**
 * Find a specific provider by reverse DNS
 *
 * @module provider/eip6963/findProvider
 */

import { InvalidArgumentError } from "./errors.js";
import { assertBrowser } from "./getPlatform.js";
import { providers } from "./state.js";

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
export function findProvider(options) {
	assertBrowser();

	// Validate options
	if (!options || typeof options !== "object") {
		throw new InvalidArgumentError("findProvider", "{ rdns: string }", typeof options);
	}
	if (!options.rdns || typeof options.rdns !== "string") {
		throw new InvalidArgumentError(
			"findProvider",
			"{ rdns: string }",
			options.rdns ? typeof options.rdns : "missing rdns",
		);
	}

	// Search for matching provider
	for (const detail of providers.values()) {
		if (detail.info.rdns === options.rdns) {
			return detail;
		}
	}

	return undefined;
}
