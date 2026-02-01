import * as Hex from "../Hex/index.js";

/**
 * Create ErrorSignature from hex string
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./ErrorSignatureType.js').ErrorSignatureType} 4-byte error signature
 * @throws {Error} If hex is not 4 bytes
 * @example
 * ```javascript
 * import * as ErrorSignature from './primitives/ErrorSignature/index.js';
 * const sig = ErrorSignature.fromHex('0xcf479181');
 * ```
 */
export function fromHex(hex) {
	const bytes = Hex.toBytes(hex);
	if (bytes.length !== 4) {
		throw new Error(
			`ErrorSignature hex must be exactly 4 bytes (8 chars), got ${bytes.length} bytes`,
		);
	}
	return /** @type {import('./ErrorSignatureType.js').ErrorSignatureType} */ (
		bytes
	);
}
