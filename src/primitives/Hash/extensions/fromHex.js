import {
	InvalidFormatError,
	InvalidLengthError,
} from "../../errors/ValidationError.js";
import { SIZE } from "./constants.js";

/**
 * Create Hash from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {string} hex - Hex string with optional 0x prefix
 * @returns {import('./BrandedHash.ts').BrandedHash} Hash bytes
 * @throws {InvalidLengthError} If hex is wrong length
 * @throws {InvalidFormatError} If hex contains invalid characters
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.fromHex('0x1234...');
 * const hash2 = Hash.fromHex('1234...'); // 0x prefix optional
 * ```
 */
export function fromHex(hex) {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (normalized.length !== SIZE * 2) {
		throw new InvalidLengthError(
			`Hash hex must be ${SIZE * 2} characters, got ${normalized.length}`,
			{
				code: "HASH_INVALID_HEX_LENGTH",
				value: hex,
				expected: `${SIZE * 2} characters`,
				context: { actualLength: normalized.length },
				docsPath: "/primitives/hash",
			},
		);
	}
	if (!/^[0-9a-fA-F]+$/.test(normalized)) {
		throw new InvalidFormatError("Invalid hex string", {
			code: "HASH_INVALID_HEX_FORMAT",
			value: hex,
			expected: "hexadecimal string",
			docsPath: "/primitives/hash",
		});
	}
	const bytes = new Uint8Array(SIZE);
	for (let i = 0; i < SIZE; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (bytes);
}
