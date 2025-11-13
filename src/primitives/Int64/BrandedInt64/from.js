/**
 * Create Int64 from various input types
 *
 * @param {bigint | number | string} value - Value to convert
 * @returns {import('./BrandedInt64.js').BrandedInt64} Int64 value
 * @throws {Error} If value is out of range
 * @example
 * ```javascript
 * import * as Int64 from './primitives/Int64/index.js';
 * const a = Int64.from(-42n);
 * const b = Int64.from("123");
 * const c = Int64.from(42);
 * ```
 */
export function from(value) {
	let bigintVal;

	if (typeof value === "bigint") {
		bigintVal = value;
	} else if (typeof value === "number") {
		if (Number.isNaN(value)) {
			throw new Error("Cannot convert NaN to Int64");
		}
		if (!Number.isFinite(value)) {
			throw new Error("Cannot convert Infinity to Int64");
		}
		bigintVal = BigInt(Math.trunc(value));
	} else if (typeof value === "string") {
		try {
			bigintVal = BigInt(value);
		} catch {
			throw new Error(`Cannot convert string to Int64: ${value}`);
		}
	} else {
		throw new Error(`Cannot convert ${typeof value} to Int64`);
	}

	if (bigintVal < -9223372036854775808n || bigintVal > 9223372036854775807n) {
		throw new Error(
			`Int64 value out of range: ${bigintVal} (must be between -9223372036854775808 and 9223372036854775807)`,
		);
	}

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (bigintVal);
}
