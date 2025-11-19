/**
 * Check if contract code contains CBOR metadata
 *
 * Solidity compiler includes CBOR-encoded metadata at the end of deployed bytecode.
 * The metadata section starts with 0xa2 (CBOR map) and ends with 0x00 0x33 (length).
 *
 * @param {import('./ContractCodeType.js').ContractCodeType} code - ContractCode to check
 * @returns {boolean} true if metadata is present
 * @example
 * ```javascript
 * import * as ContractCode from './primitives/ContractCode/index.js';
 * const code = ContractCode.from("0x6001600155a264...0033");
 * ContractCode._hasMetadata(code); // true
 * ```
 */
export function hasMetadata(code) {
	// Solidity metadata format: bytecode + metadata + 0x00 + length_byte
	// Length byte is typically 0x20-0x40 (32-64 bytes)
	if (code.length < 2) return false;

	const lastTwo = code.slice(-2);
	const b0 = lastTwo[0] ?? 0;
	const b1 = lastTwo[1] ?? 0;

	// Check for common metadata length markers
	return b0 === 0x00 && b1 >= 0x20 && b1 <= 0x40;
}
