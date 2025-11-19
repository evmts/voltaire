import { decode } from "./decode.js";

/**
 * Extract metadata from contract bytecode
 *
 * Solidity appends CBOR metadata at the end: bytecode + metadata + 0x00 + length
 *
 * @param {Uint8Array} bytecode - Contract bytecode with metadata
 * @returns {import('./MetadataType.js').Metadata | null} Metadata or null if not found
 * @example
 * ```javascript
 * import * as Metadata from './primitives/Metadata/index.js';
 * const bytecode = new Uint8Array([...code, 0xa2, 0x64, ...metadata, 0x00, 0x33]);
 * const meta = Metadata.fromBytecode(bytecode);
 * ```
 */
export function fromBytecode(bytecode) {
	if (bytecode.length < 2) return null;

	const lastTwo = bytecode.slice(-2);
	const b0 = lastTwo[0] ?? 0;
	const b1 = lastTwo[1] ?? 0;

	// Check for metadata marker: 0x00 + length
	if (b0 !== 0x00 || b1 < 0x20 || b1 > 0x40) {
		return null;
	}

	const metadataLength = b1;
	if (bytecode.length < metadataLength + 2) return null;

	const metadataStart = bytecode.length - metadataLength - 2;
	const raw = bytecode.slice(metadataStart, -2);

	return decode(raw);
}
