import { InvalidFormatError } from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import type { HexType } from "./HexType.js";
import { validate } from "./validate.js";

/**
 * Create Hex from string or bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - Hex string or bytes
 * @returns Hex string
 * @throws {InvalidFormatError} If input is not a string/Uint8Array or string is missing 0x prefix
 * @throws {import('./errors.js').InvalidCharacterError} If string contains invalid hex characters
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const hex2 = Hex.from(new Uint8Array([0x12, 0x34]));
 * ```
 */
export function from(value: string | Uint8Array): HexType {
	if (typeof value === "string") {
		return validate(value) as HexType;
	}
	if (!(value instanceof Uint8Array)) {
		throw new InvalidFormatError("Hex value must be a string or Uint8Array", {
			value,
			expected: "0x-prefixed hex string or Uint8Array",
		});
	}
	return fromBytes(value);
}
