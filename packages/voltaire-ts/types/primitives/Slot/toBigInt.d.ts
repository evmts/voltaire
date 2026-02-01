/**
 * Convert Slot to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/slot for Slot documentation
 * @since 0.0.0
 * @param {import('./SlotType.js').SlotType} slot - Slot value
 * @returns {bigint} BigInt representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Slot from './primitives/Slot/index.js';
 * const slot = Slot.from(1000000);
 * const big = Slot.toBigInt(slot); // 1000000n
 * ```
 */
export function toBigInt(slot: import("./SlotType.js").SlotType): bigint;
//# sourceMappingURL=toBigInt.d.ts.map