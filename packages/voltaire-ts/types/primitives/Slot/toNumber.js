/**
 * Convert Slot to number
 *
 * @see https://voltaire.tevm.sh/primitives/slot for Slot documentation
 * @since 0.0.0
 * @param {import('./SlotType.js').SlotType} slot - Slot value
 * @returns {number} Number representation
 * @throws {Error} If slot exceeds safe integer range
 * @example
 * ```javascript
 * import * as Slot from './primitives/Slot/index.js';
 * const slot = Slot.from(1000000n);
 * const num = Slot.toNumber(slot); // 1000000
 * ```
 */
export function toNumber(slot) {
    if (slot > Number.MAX_SAFE_INTEGER) {
        throw new Error(`Slot ${slot} exceeds MAX_SAFE_INTEGER`);
    }
    return Number(slot);
}
