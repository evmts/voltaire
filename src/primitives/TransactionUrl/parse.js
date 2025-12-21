import * as Address from "../Address/internal-index.js";
import { from as bytesFrom } from "../Bytes/from.js";
import { Hex } from "../Hex/index.js";
import { InvalidTransactionUrlError } from "./errors.js";

/**
 * Parse ERC-681 transaction URL
 *
 * Format: ethereum:<address>[@<chainId>][/<function>][?<params>]
 *
 * Examples:
 * - ethereum:0x1234...
 * - ethereum:0x1234@1
 * - ethereum:0x1234@1?value=1000000000000000000
 * - ethereum:0x1234/transfer?address=0x5678&uint256=100
 *
 * Query parameters:
 * - value: wei amount (decimal or hex with 0x)
 * - gas: gas limit
 * - gasPrice: gas price in wei
 * - data: hex-encoded calldata (0x...)
 *
 * @see https://eips.ethereum.org/EIPS/eip-681
 * @param {string} url - ERC-681 URL
 * @returns {import('./TransactionUrlType.js').ParsedTransactionUrl}
 * @throws {InvalidTransactionUrlError} if URL is malformed
 *
 * @example
 * ```javascript
 * import { parse } from './primitives/TransactionUrl/parse.js';
 *
 * const parsed = parse('ethereum:0x1234...@1?value=1000000000000000000');
 * // { target: AddressType, chainId: 1n, value: 1000000000000000000n }
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: URL parsing requires sequential extraction of components
export function parse(url) {
	// Validate scheme
	if (!url.startsWith("ethereum:")) {
		throw new InvalidTransactionUrlError(
			"Invalid URL scheme, expected 'ethereum:'",
			{
				url,
				scheme: url.split(":")[0],
			},
		);
	}

	// Remove scheme
	const remaining = url.slice(9); // "ethereum:".length

	// Split into parts: <address>[@chainId][/function][?params]
	let addressPart = remaining;
	let chainId;
	let functionName;
	let queryString;

	// Extract query string if present
	const queryIndex = remaining.indexOf("?");
	if (queryIndex !== -1) {
		queryString = remaining.slice(queryIndex + 1);
		addressPart = remaining.slice(0, queryIndex);
	}

	// Extract function name if present
	const functionIndex = addressPart.indexOf("/");
	if (functionIndex !== -1) {
		functionName = decodeURIComponent(addressPart.slice(functionIndex + 1));
		addressPart = addressPart.slice(0, functionIndex);
	}

	// Extract chain ID if present
	const chainIndex = addressPart.indexOf("@");
	if (chainIndex !== -1) {
		const chainIdStr = addressPart.slice(chainIndex + 1);
		addressPart = addressPart.slice(0, chainIndex);

		// Parse chain ID
		try {
			chainId = BigInt(chainIdStr);
			// Validate chain ID is non-negative
			if (chainId < 0n) {
				throw new Error("Chain ID must be non-negative");
			}
		} catch {
			throw new InvalidTransactionUrlError("Invalid chain ID", {
				chainId: chainIdStr,
				url,
			});
		}
	}

	// Parse address
	let target;
	try {
		target = Address.from(addressPart);
	} catch (error) {
		throw new InvalidTransactionUrlError("Invalid Ethereum address", {
			address: addressPart,
			url,
			error: error instanceof Error ? error.message : String(error),
		});
	}

	// Build result - use object spread to build incrementally
	/** @type {Partial<import('./TransactionUrlType.js').ParsedTransactionUrl>} */
	let result = { target };

	if (chainId !== undefined) {
		result = { ...result, chainId };
	}

	if (functionName !== undefined) {
		result = { ...result, functionName };
	}

	// Parse query parameters
	if (queryString) {
		const params = parseQueryString(queryString, url);

		if (params.value !== undefined) {
			result = { ...result, value: params.value };
		}
		if (params.gas !== undefined) {
			result = { ...result, gas: params.gas };
		}
		if (params.gasPrice !== undefined) {
			result = { ...result, gasPrice: params.gasPrice };
		}
		if (params.data !== undefined) {
			result = { ...result, data: params.data };
		}
		if (params.functionParams !== undefined) {
			result = { ...result, functionParams: params.functionParams };
		}
	}

	return /** @type {import('./TransactionUrlType.js').ParsedTransactionUrl} */ (result);
}

/**
 * Parse query string parameters
 *
 * @param {string} queryString - Query string without leading '?'
 * @param {string} url - Original URL (for error context)
 * @returns {{
 *   value?: bigint,
 *   gas?: bigint,
 *   gasPrice?: bigint,
 *   data?: import('../Bytes/BytesType.js').BytesType,
 *   functionParams?: Record<string, string>
 * }}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Query parameter parsing requires handling multiple parameter types
function parseQueryString(queryString, url) {
	/** @type {Record<string, string>} */
	const functionParams = {};

	/** @type {{
	 *   value?: bigint,
	 *   gas?: bigint,
	 *   gasPrice?: bigint,
	 *   data?: import('../Bytes/BytesType.js').BytesType,
	 *   functionParams?: Record<string, string>
	 * }} */
	const result = {};

	const pairs = queryString.split("&");

	for (const pair of pairs) {
		const eqIndex = pair.indexOf("=");
		if (eqIndex === -1) {
			continue; // Skip malformed pairs
		}

		const key = decodeURIComponent(pair.slice(0, eqIndex));
		const value = decodeURIComponent(pair.slice(eqIndex + 1));

		// Handle standard parameters
		if (key === "value" || key === "gas" || key === "gasPrice") {
			try {
				result[key] = parseBigIntParam(value);
			} catch {
				throw new InvalidTransactionUrlError(`Invalid ${key} parameter`, {
					key,
					value,
					url,
				});
			}
		} else if (key === "data") {
			// Parse hex data
			try {
				const hexValue = Hex.from(value);
				/** @type {*} */ (result).data = bytesFrom(Hex.toBytes(hexValue));
			} catch (error) {
				throw new InvalidTransactionUrlError("Invalid data parameter", {
					key,
					value,
					url,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		} else {
			// Function parameters
			functionParams[key] = value;
		}
	}

	if (Object.keys(functionParams).length > 0) {
		result.functionParams = functionParams;
	}

	return result;
}

/**
 * Parse a numeric parameter (supports both decimal and hex with 0x prefix)
 *
 * @param {string} value - Numeric string
 * @returns {bigint}
 */
function parseBigIntParam(value) {
	// Support hex with 0x prefix
	if (value.startsWith("0x")) {
		return BigInt(value);
	}
	// Support decimal
	return BigInt(value);
}
