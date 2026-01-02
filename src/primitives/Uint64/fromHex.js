import { MAX } from "./constants.js";
import {
	Uint64InvalidHexError,
	Uint64NegativeError,
	Uint64OverflowError,
} from "./errors.js";

/**
 * Create Uint64 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./Uint64Type.js').Uint64Type} Uint64 value
 * @throws {Uint64InvalidHexError} If input is not a string
 * @throws {Uint64NegativeError} If value is negative
 * @throws {Uint64OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.fromHex("0xffffffffffffffff");
 * const b = Uint64.fromHex("ff");
 * ```
 */
export function fromHex(hex) {
	if (typeof hex !== "string") {
		throw new Uint64InvalidHexError(
			`Uint64.fromHex requires string, got ${typeof hex}`,
			{ value: hex },
		);
	}

	const value = BigInt(hex.startsWith("0x") ? hex : `0x${hex}`);

	if (value < 0n) {
		throw new Uint64NegativeError(`Uint64 value cannot be negative: ${value}`, {
			value,
		});
	}

	if (value > MAX) {
		throw new Uint64OverflowError(`Uint64 value exceeds maximum: ${value}`, {
			value,
		});
	}

	return /** @type {import('./Uint64Type.js').Uint64Type} */ (value);
}
