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
export function toNumber(slot: import("./SlotType.js").SlotType): number;
//# sourceMappingURL=toNumber.d.ts.map