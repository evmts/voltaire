import { fromHex } from "./fromHex.js";

/**
 * Create EventSignature from various input types
 *
 * @param {import('./EventSignatureType.js').EventSignatureLike} value - Input value
 * @returns {import('./EventSignatureType.js').EventSignatureType} 32-byte event signature
 * @throws {Error} If input is invalid
 * @example
 * ```javascript
 * import * as EventSignature from './primitives/EventSignature/index.js';
 * const sig = EventSignature.from('0xddf252ad...');
 * const sig2 = EventSignature.from(new Uint8Array(32));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}

	if (value instanceof Uint8Array) {
		if (value.length !== 32) {
			throw new Error(
				`EventSignature must be exactly 32 bytes, got ${value.length}`,
			);
		}
		return /** @type {import('./EventSignatureType.js').EventSignatureType} */ (
			value
		);
	}

	throw new Error(`Invalid event signature input: ${typeof value}`);
}
