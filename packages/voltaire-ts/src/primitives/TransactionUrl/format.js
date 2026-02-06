import * as Address from "../Address/internal-index.js";
import { Hex } from "../Hex/index.js";

/**
 * Format transaction request as ERC-681 URL
 *
 * @see https://eips.ethereum.org/EIPS/eip-681
 * @param {import('./TransactionUrlType.js').ParsedTransactionUrl} request - Transaction parameters
 * @returns {import('./TransactionUrlType.js').TransactionUrl} - ERC-681 formatted URL
 *
 * @example
 * ```javascript
 * import { format } from './primitives/TransactionUrl/format.js';
 *
 * const url = format({
 *   target: addressValue,
 *   chainId: 1n,
 *   value: 1000000000000000000n,
 * });
 * // 'ethereum:0x1234...@1?value=1000000000000000000'
 * ```
 */
export function format(request) {
	// Start with scheme and checksummed address
	let url = `ethereum:${Address.toChecksummed(request.target)}`;

	// Add chain ID if present
	if (request.chainId !== undefined) {
		url += `@${request.chainId}`;
	}

	// Add function name if present
	if (request.functionName !== undefined) {
		url += `/${encodeURIComponent(request.functionName)}`;
	}

	// Build query parameters
	/** @type {string[]} */
	const params = [];

	if (request.value !== undefined) {
		params.push(`value=${request.value}`);
	}

	if (request.gas !== undefined) {
		params.push(`gas=${request.gas}`);
	}

	if (request.gasPrice !== undefined) {
		params.push(`gasPrice=${request.gasPrice}`);
	}

	if (request.data !== undefined) {
		const hexData = Hex.from(Hex.fromBytes(request.data));
		params.push(`data=${hexData}`);
	}

	// Add function parameters
	if (request.functionParams !== undefined) {
		for (const [key, value] of Object.entries(request.functionParams)) {
			params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
		}
	}

	// Append query string if we have parameters
	if (params.length > 0) {
		url += `?${params.join("&")}`;
	}

	return /** @type {import('./TransactionUrlType.js').TransactionUrl} */ (url);
}
