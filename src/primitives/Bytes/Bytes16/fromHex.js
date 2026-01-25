import { InvalidFormatError, InvalidLengthError } from "../../errors/index.js";
import { SIZE } from "./constants.js";

/**
 * Create Bytes16 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {string} hex - Hex string with optional 0x prefix
 * @returns {import('./Bytes16Type.js').Bytes16Type} Bytes16
 * @throws {InvalidLengthError} If hex is wrong length
 * @throws {InvalidFormatError} If hex contains invalid characters
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const bytes = Bytes16.fromHex('0x1234567890abcdef1234567890abcdef');
 * ```
 */
export function fromHex(hex) {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (normalized.length !== SIZE * 2) {
		throw new InvalidLengthError(
			`Bytes16 hex must be ${SIZE * 2} characters, got ${normalized.length}`,
			{
				code: -32602,
				value: hex,
				expected: `${SIZE * 2} characters`,
				context: { actualLength: normalized.length },
				docsPath: "/primitives/bytes/bytes16",
			},
		);
	}
	if (!/^[0-9a-fA-F]+$/.test(normalized)) {
		throw new InvalidFormatError("Invalid hex string", {
			code: -32602,
			value: hex,
			expected: "hexadecimal string",
			docsPath: "/primitives/bytes/bytes16",
		});
	}
	const bytes = new Uint8Array(SIZE);
	for (let i = 0; i < SIZE; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return /** @type {import('./Bytes16Type.js').Bytes16Type} */ (bytes);
}
