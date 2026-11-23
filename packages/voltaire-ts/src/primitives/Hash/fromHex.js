import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";
import { decodeHexDigitsInto } from "../Hex/decodeHexDigitsInto.js";
import { SIZE } from "./constants.js";

/**
 * Create Hash from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {string} hex - Hex string with optional 0x prefix
 * @returns {import('./HashType.js').HashType} Hash bytes
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
	const offset = hex.startsWith("0x") ? 2 : 0;
	const length = hex.length - offset;
	if (length !== SIZE * 2) {
		throw new InvalidLengthError(
			`Hash hex must be ${SIZE * 2} characters, got ${length}`,
			{
				code: -32602,
				value: hex,
				expected: `${SIZE * 2} characters`,
				context: { actualLength: length },
				docsPath: "/primitives/hash",
			},
		);
	}
	const bytes = new Uint8Array(SIZE);
	if (decodeHexDigitsInto(hex, offset, bytes) !== -1) {
		throw new InvalidFormatError("Invalid hex string", {
			code: -32602,
			value: hex,
			expected: "hexadecimal string",
			docsPath: "/primitives/hash",
		});
	}
	return /** @type {import('./HashType.js').HashType} */ (bytes);
}
