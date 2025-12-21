import { Hex } from "../Hex/index.js";

/**
 * Create ContractCode from hex string
 *
 * @param {string} hex - Hex string
 * @returns {import('./ContractCodeType.js').ContractCodeType} ContractCode
 * @throws {Error} If hex string is invalid
 * @example
 * ```javascript
 * import * as ContractCode from './primitives/ContractCode/index.js';
 * const code = ContractCode.fromHex("0x6001600155");
 * ```
 */
export function fromHex(hex) {
	const bytes = Hex.toBytes(Hex.from(hex));
	return /** @type {import('./ContractCodeType.js').ContractCodeType} */ (
		bytes
	);
}
