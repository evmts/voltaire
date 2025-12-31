import { RlpDecodingError } from "./RlpError.js";

/**
 * Validates if RLP encoding is canonical
 *
 * Canonical encoding rules:
 * - Integers must use minimum bytes (no leading zeros)
 * - Strings/bytes must use shortest length prefix
 * - Single byte < 0x80 must not be encoded as string
 * - Length prefix must use minimum bytes
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @see https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/ for canonical rules
 * @since 0.0.0
 * @param {Uint8Array} bytes - RLP-encoded data
 * @param {number} [depth=0] - Current recursion depth (internal)
 * @returns {boolean} True if encoding is canonical
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * // Canonical encoding
 * const canonical = new Uint8Array([0x83, 0x64, 0x6f, 0x67]); // "dog"
 * Rlp.isCanonical(canonical); // => true
 *
 * // Non-canonical: single byte should not be prefixed
 * const nonCanonical = new Uint8Array([0x81, 0x7f]); // should be just 0x7f
 * Rlp.isCanonical(nonCanonical); // => false
 *
 * // Non-canonical: leading zeros in length
 * const leadingZeros = new Uint8Array([0xb8, 0x00, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
 * Rlp.isCanonical(leadingZeros); // => false
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: canonical RLP validation requires many checks
export function isCanonical(bytes, depth = 0) {
	if (bytes.length === 0) {
		return false;
	}

	// Prevent infinite recursion (MAX_DEPTH is 32)
	// Allow up to depth 31 (0-indexed, so 32 total levels)
	if (depth > 31) {
		return false;
	}

	const prefix = bytes[0];
	if (prefix === undefined) {
		return false;
	}

	// Single byte [0x00, 0x7f]
	if (prefix <= 0x7f) {
		return true;
	}

	// Short string [0x80, 0xb7]
	if (prefix <= 0xb7) {
		const length = prefix - 0x80;

		// Non-canonical: single byte < 0x80 should not be prefixed
		if (length === 1 && bytes.length > 1) {
			const nextByte = bytes[1];
			if (nextByte !== undefined && nextByte < 0x80) {
				return false;
			}
		}

		if (bytes.length < 1 + length) {
			return false;
		}

		return true;
	}

	// Long string [0xb8, 0xbf]
	if (prefix <= 0xbf) {
		const lengthOfLength = prefix - 0xb7;
		if (bytes.length < 1 + lengthOfLength) {
			return false;
		}

		// Non-canonical: leading zeros in length
		if (bytes[1] === 0) {
			return false;
		}

		let length = 0;
		for (let i = 0; i < lengthOfLength; i++) {
			const byte = bytes[1 + i];
			if (byte === undefined) {
				return false;
			}
			length = length * 256 + byte;
		}

		// Non-canonical: < 56 bytes should use short form
		if (length < 56) {
			return false;
		}

		if (bytes.length < 1 + lengthOfLength + length) {
			return false;
		}

		return true;
	}

	// Short list [0xc0, 0xf7]
	if (prefix <= 0xf7) {
		const length = prefix - 0xc0;
		if (bytes.length < 1 + length) {
			return false;
		}

		// Recursively validate list items
		let offset = 1;
		while (offset < 1 + length) {
			if (!isCanonical(bytes.slice(offset), depth + 1)) {
				return false;
			}
			// Calculate item length to advance offset
			const itemLength = getItemLength(bytes.slice(offset));
			if (itemLength === 0) {
				return false;
			}
			offset += itemLength;
		}

		return offset === 1 + length;
	}

	// Long list [0xf8, 0xff]
	if (prefix <= 0xff) {
		const lengthOfLength = prefix - 0xf7;
		if (bytes.length < 1 + lengthOfLength) {
			return false;
		}

		// Non-canonical: leading zeros in length
		if (bytes[1] === 0) {
			return false;
		}

		let length = 0;
		for (let i = 0; i < lengthOfLength; i++) {
			const byte = bytes[1 + i];
			if (byte === undefined) {
				return false;
			}
			length = length * 256 + byte;
		}

		// Non-canonical: < 56 bytes should use short form
		if (length < 56) {
			return false;
		}

		if (bytes.length < 1 + lengthOfLength + length) {
			return false;
		}

		// Recursively validate list items
		let offset = 1 + lengthOfLength;
		const endOffset = 1 + lengthOfLength + length;
		while (offset < endOffset) {
			if (!isCanonical(bytes.slice(offset), depth + 1)) {
				return false;
			}
			// Calculate item length to advance offset
			const itemLength = getItemLength(bytes.slice(offset));
			if (itemLength === 0) {
				return false;
			}
			offset += itemLength;
		}

		return offset === endOffset;
	}

	return false;
}

/**
 * Calculate the length of a single RLP item
 * @internal
 * @param {Uint8Array} bytes
 * @returns {number}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: RLP item length calculation requires many checks
function getItemLength(bytes) {
	if (bytes.length === 0) {
		return 0;
	}

	const prefix = bytes[0];
	if (prefix === undefined) {
		return 0;
	}

	// Single byte [0x00, 0x7f]
	if (prefix <= 0x7f) {
		return 1;
	}

	// Short string [0x80, 0xb7]
	if (prefix <= 0xb7) {
		const length = prefix - 0x80;
		if (bytes.length < 1 + length) {
			return 0;
		}
		return 1 + length;
	}

	// Long string [0xb8, 0xbf]
	if (prefix <= 0xbf) {
		const lengthOfLength = prefix - 0xb7;
		if (bytes.length < 1 + lengthOfLength) {
			return 0;
		}

		let length = 0;
		for (let i = 0; i < lengthOfLength; i++) {
			const byte = bytes[1 + i];
			if (byte === undefined) {
				return 0;
			}
			length = length * 256 + byte;
		}

		if (bytes.length < 1 + lengthOfLength + length) {
			return 0;
		}
		return 1 + lengthOfLength + length;
	}

	// Short list [0xc0, 0xf7]
	if (prefix <= 0xf7) {
		const length = prefix - 0xc0;
		if (bytes.length < 1 + length) {
			return 0;
		}
		return 1 + length;
	}

	// Long list [0xf8, 0xff]
	const lengthOfLength = prefix - 0xf7;
	if (bytes.length < 1 + lengthOfLength) {
		return 0;
	}

	let length = 0;
	for (let i = 0; i < lengthOfLength; i++) {
		const byte = bytes[1 + i];
		if (byte === undefined) {
			return 0;
		}
		length = length * 256 + byte;
	}

	if (bytes.length < 1 + lengthOfLength + length) {
		return 0;
	}
	return 1 + lengthOfLength + length;
}
