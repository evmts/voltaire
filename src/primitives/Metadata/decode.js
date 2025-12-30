import * as Hex from "../Hex/index.js";

/**
 * Decode CBOR-encoded metadata
 *
 * Parses Solidity metadata format to extract compiler version and content hashes.
 *
 * @param {Uint8Array} raw - CBOR-encoded metadata
 * @returns {import('./MetadataType.js').Metadata} Metadata
 * @example
 * ```javascript
 * import * as Metadata from './primitives/Metadata/index.js';
 * const raw = new Uint8Array([0xa2, 0x64, ...]);
 * const meta = Metadata.decode(raw);
 * console.log(meta.solc); // "0.8.19"
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: CBOR parsing requires sequential byte handling
export function decode(raw) {
	/** @type {import('./MetadataType.js').Metadata} */
	const metadata = { raw };

	// Simple CBOR parser for Solidity metadata
	// Format: map with string keys ("ipfs", "solc", "bzzr0", "bzzr1", "experimental")
	let i = 0;

	// Skip initial map marker (0xa2 = map with 2 items, 0xa3 = 3 items, etc.)
	if (
		raw[i] === 0xa2 ||
		raw[i] === 0xa3 ||
		raw[i] === 0xa4 ||
		raw[i] === 0xa5
	) {
		i++;
	}

	while (i < raw.length) {
		// Read key (string)
		if (raw[i] === 0x64) {
			// 4-byte string ("ipfs", "solc")
			i++;
			const keyBytes = raw.slice(i, i + 4);
			const key = new TextDecoder().decode(keyBytes);
			i += 4;

			// Read value
			if (raw[i] === 0x58) {
				// byte string with 1-byte length
				i++;
				const len = raw[i] ?? 0;
				i++;
				const value = raw.slice(i, i + len);
				i += len;

				if (key === "ipfs") {
					/** @type {*} */ (metadata).ipfs = Hex.fromBytes(value);
				} else if (key === "solc") {
					/** @type {*} */ (metadata).solc = new TextDecoder().decode(value);
				}
			} else if (raw[i] === 0x58 || raw[i] === 0x14 || raw[i] === 0x20) {
				// Fixed-size byte strings
				const len =
					raw[i] === 0x58 ? (raw[++i] ?? 0) : raw[i] === 0x20 ? 32 : 20;
				i++;
				const value = raw.slice(i, i + len);
				i += len;

				if (key === "ipfs") {
					/** @type {*} */ (metadata).ipfs = Hex.fromBytes(value);
				}
			}
		} else if (raw[i] === 0x65) {
			// 5-byte string ("bzzr0", "bzzr1")
			i++;
			const keyBytes = raw.slice(i, i + 5);
			const key = new TextDecoder().decode(keyBytes);
			i += 5;

			// Read value (32-byte hash)
			if (raw[i] === 0x58) {
				i++;
				const len = raw[i] ?? 0;
				i++;
				const value = raw.slice(i, i + len);
				i += len;

				if (key === "bzzr0") {
					/** @type {*} */ (metadata).bzzr0 = Hex.fromBytes(value);
				} else if (key === "bzzr1") {
					/** @type {*} */ (metadata).bzzr1 = Hex.fromBytes(value);
				}
			}
		} else if (raw[i] === 0x6c) {
			// 12-byte string ("experimental")
			i++;
			i += 12; // Skip "experimental"

			// Read boolean value
			if (raw[i] === 0xf5) {
				/** @type {*} */ (metadata).experimental = true;
				i++;
			} else if (raw[i] === 0xf4) {
				/** @type {*} */ (metadata).experimental = false;
				i++;
			}
		} else {
			// Unknown format, skip
			break;
		}
	}

	return metadata;
}
