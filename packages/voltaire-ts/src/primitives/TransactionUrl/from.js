import { parse } from "./parse.js";

/**
 * Create TransactionUrl from string (alias for parse)
 *
 * @param {string} url - ERC-681 URL string
 * @returns {import('./TransactionUrlType.js').TransactionUrl}
 * @throws {import('./errors.js').InvalidTransactionUrlError} if URL is malformed
 *
 * @example
 * ```javascript
 * import * as TransactionUrl from './primitives/TransactionUrl/index.js';
 *
 * const url = TransactionUrl.from('ethereum:0x1234...@1?value=1000000000000000000');
 * ```
 */
export function from(url) {
	// Validate by parsing
	parse(url);
	return /** @type {import('./TransactionUrlType.js').TransactionUrl} */ (url);
}
