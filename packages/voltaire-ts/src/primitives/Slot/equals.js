/**
 * Check if Slot values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/slot for Slot documentation
 * @since 0.0.0
 * @param {import('./SlotType.js').SlotType} a - First slot
 * @param {import('./SlotType.js').SlotType} b - Second slot
 * @returns {boolean} true if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Slot from './primitives/Slot/index.js';
 * const a = Slot.from(1000000n);
 * const b = Slot.from(1000000n);
 * const result = Slot.equals(a, b); // true
 * ```
 */
export function equals(a, b) {
	return a === b;
}
