import { Hex } from "../Hex/index.js";

/**
 * Encode metadata to CBOR format
 *
 * Creates CBOR-encoded metadata following Solidity format.
 *
 * @param {import('./MetadataType.js').Metadata} metadata - Metadata to encode
 * @returns {Uint8Array} CBOR-encoded bytes
 * @example
 * ```javascript
 * import * as Metadata from './primitives/Metadata/index.js';
 * const meta = {
 *   raw: new Uint8Array(),
 *   solc: "0.8.19",
 *   ipfs: "0x1234...",
 * };
 * const encoded = Metadata.encode(meta);
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: CBOR encoding requires field-by-field serialization
export function encode(metadata) {
	const parts = [];

	// Count items
	let itemCount = 0;
	if (metadata.ipfs) itemCount++;
	if (metadata.solc) itemCount++;
	if (metadata.bzzr0) itemCount++;
	if (metadata.bzzr1) itemCount++;
	if (metadata.experimental !== undefined) itemCount++;

	// CBOR map header (0xa0 + item count)
	parts.push(new Uint8Array([0xa0 + itemCount]));

	// Add ipfs field
	if (metadata.ipfs) {
		// Key: "ipfs" (4-byte string = 0x64)
		parts.push(new Uint8Array([0x64]));
		parts.push(new TextEncoder().encode("ipfs"));

		// Value: byte string
		const ipfsBytes = Hex.toBytes(Hex.from(metadata.ipfs));
		if (ipfsBytes.length <= 23) {
			parts.push(new Uint8Array([0x40 + ipfsBytes.length]));
		} else {
			parts.push(new Uint8Array([0x58, ipfsBytes.length]));
		}
		parts.push(ipfsBytes);
	}

	// Add solc field
	if (metadata.solc) {
		// Key: "solc" (4-byte string = 0x64)
		parts.push(new Uint8Array([0x64]));
		parts.push(new TextEncoder().encode("solc"));

		// Value: string
		const solcBytes = new TextEncoder().encode(metadata.solc);
		if (solcBytes.length <= 23) {
			parts.push(new Uint8Array([0x60 + solcBytes.length]));
		} else {
			parts.push(new Uint8Array([0x78, solcBytes.length]));
		}
		parts.push(solcBytes);
	}

	// Add bzzr0 field
	if (metadata.bzzr0) {
		// Key: "bzzr0" (5-byte string = 0x65)
		parts.push(new Uint8Array([0x65]));
		parts.push(new TextEncoder().encode("bzzr0"));

		// Value: 32-byte hash
		const bzzr0Bytes = Hex.toBytes(Hex.from(metadata.bzzr0));
		parts.push(new Uint8Array([0x58, bzzr0Bytes.length]));
		parts.push(bzzr0Bytes);
	}

	// Add bzzr1 field
	if (metadata.bzzr1) {
		// Key: "bzzr1" (5-byte string = 0x65)
		parts.push(new Uint8Array([0x65]));
		parts.push(new TextEncoder().encode("bzzr1"));

		// Value: 32-byte hash
		const bzzr1Bytes = Hex.toBytes(Hex.from(metadata.bzzr1));
		parts.push(new Uint8Array([0x58, bzzr1Bytes.length]));
		parts.push(bzzr1Bytes);
	}

	// Add experimental field
	if (metadata.experimental !== undefined) {
		// Key: "experimental" (12-byte string = 0x6c)
		parts.push(new Uint8Array([0x6c]));
		parts.push(new TextEncoder().encode("experimental"));

		// Value: boolean (0xf5 = true, 0xf4 = false)
		parts.push(new Uint8Array([metadata.experimental ? 0xf5 : 0xf4]));
	}

	// Concatenate all parts
	const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}

	return result;
}
