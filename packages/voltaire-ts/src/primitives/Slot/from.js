/**
 * Create Slot from number, bigint, or string
 *
 * @see https://voltaire.tevm.sh/primitives/slot for Slot documentation
 * @since 0.0.0
 * @param {number | bigint | string} value - Slot number (number, bigint, or decimal/hex string)
 * @returns {import('./SlotType.js').SlotType} Slot value
 * @throws {Error} If value is negative or invalid
 * @example
 * ```javascript
 * import * as Slot from './primitives/Slot/index.js';
 * const slot1 = Slot.from(1000000n);
 * const slot2 = Slot.from(1000000);
 * const slot3 = Slot.from("0xf4240");
 * ```
 */
export function from(value) {
	let bigintValue;

	if (typeof value === "string") {
		bigintValue = BigInt(value);
	} else if (typeof value === "number") {
		if (!Number.isSafeInteger(value)) {
			throw new Error(`Slot value must be a safe integer: ${value}`);
		}
		if (value < 0) {
			throw new Error(`Slot value cannot be negative: ${value}`);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new Error(`Slot value cannot be negative: ${bigintValue}`);
	}

	return /** @type {import('./SlotType.js').SlotType} */ (bigintValue);
}
