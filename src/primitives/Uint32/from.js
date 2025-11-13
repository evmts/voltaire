import { MAX } from "./constants.js";

/**
 * Create Uint32 from number, bigint, or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {number | bigint | string} value - number, bigint, or decimal/hex string
 * @returns {import('./BrandedUint32.js').BrandedUint32} Uint32 value
 * @throws {Error} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from("255");
 * const c = Uint32.from("0xff");
 * const d = Uint32.from(42n);
 * ```
 */
export function from(value) {
	let numberValue;

	if (typeof value === "string") {
		if (value.startsWith("0x") || value.startsWith("0X")) {
			numberValue = Number(BigInt(value));
		} else {
			numberValue = Number(value);
		}
	} else if (typeof value === "bigint") {
		numberValue = Number(value);
	} else {
		numberValue = value;
	}

	if (!Number.isSafeInteger(numberValue)) {
		throw new Error(`Uint32 value must be a safe integer: ${value}`);
	}

	if (!Number.isInteger(numberValue)) {
		throw new Error(`Uint32 value must be an integer: ${value}`);
	}

	if (numberValue < 0) {
		throw new Error(`Uint32 value cannot be negative: ${numberValue}`);
	}

	if (numberValue > MAX) {
		throw new Error(`Uint32 value exceeds maximum: ${numberValue}`);
	}

	return numberValue;
}
