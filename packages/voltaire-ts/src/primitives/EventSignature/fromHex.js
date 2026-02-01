import * as Hex from "../Hex/index.js";

/**
 * Create EventSignature from hex string
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./EventSignatureType.js').EventSignatureType} 32-byte event signature
 * @throws {Error} If hex is not 32 bytes
 * @example
 * ```javascript
 * import * as EventSignature from './primitives/EventSignature/index.js';
 * const sig = EventSignature.fromHex('0xddf252ad...');
 * ```
 */
export function fromHex(hex) {
	const bytes = Hex.toBytes(hex);
	if (bytes.length !== 32) {
		throw new Error(
			`EventSignature hex must be exactly 32 bytes (64 chars), got ${bytes.length} bytes`,
		);
	}
	return /** @type {import('./EventSignatureType.js').EventSignatureType} */ (
		bytes
	);
}
