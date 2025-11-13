/**
 * Create Int32 from various input types
 *
 * @param {number | bigint | string} value - Value to convert
 * @returns {import('./BrandedInt32.js').BrandedInt32} Int32 value
 * @throws {Error} If value is out of range
 * @example
 * ```javascript
 * import * as Int32 from './primitives/Int32/index.js';
 * const a = Int32.from(-42);
 * const b = Int32.from("123");
 * const c = Int32.from(-2147483648n);
 * ```
 */
export function from(value) {
	let num;

	if (typeof value === "number") {
		num = value;
	} else if (typeof value === "bigint") {
		if (value < -2147483648n || value > 2147483647n) {
			throw new Error(
				`Int32 value out of range: ${value} (must be between -2147483648 and 2147483647)`,
			);
		}
		num = Number(value);
	} else if (typeof value === "string") {
		const parsed = Number(value);
		if (Number.isNaN(parsed)) {
			throw new Error(`Cannot convert string to Int32: ${value}`);
		}
		num = parsed;
	} else {
		throw new Error(`Cannot convert ${typeof value} to Int32`);
	}

	// Truncate to 32-bit signed integer
	num = num | 0;

	if (num < -2147483648 || num > 2147483647) {
		throw new Error(
			`Int32 value out of range: ${num} (must be between -2147483648 and 2147483647)`,
		);
	}

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (num);
}
