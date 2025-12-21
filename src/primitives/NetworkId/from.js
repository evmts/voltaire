import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Create NetworkId from number
 *
 * @param {number} value - Network ID number
 * @returns {import('./NetworkIdType.js').NetworkIdType} Branded network ID
 * @throws {InvalidFormatError} If value is not a non-negative integer
 *
 * @example
 * ```javascript
 * import * as NetworkId from './primitives/NetworkId/index.js';
 * const mainnet = NetworkId.from(1);
 * const sepolia = NetworkId.from(11155111);
 * ```
 */
export function from(value) {
	if (!Number.isInteger(value) || value < 0) {
		throw new InvalidFormatError(
			`Network ID must be non-negative integer, got ${value}`,
			{
				value,
				expected: "Non-negative integer",
				code: "NETWORK_ID_INVALID_FORMAT",
				docsPath: "/primitives/network-id/from#error-handling",
			},
		);
	}
	return /** @type {import('./NetworkIdType.js').NetworkIdType} */ (value);
}
