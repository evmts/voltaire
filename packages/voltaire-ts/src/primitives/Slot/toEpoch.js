import * as Epoch from "../Epoch/index.js";

/**
 * Convert Slot to its corresponding Epoch
 *
 * Each epoch contains 32 slots. This function performs integer division: epoch = slot / 32.
 *
 * @see https://voltaire.tevm.sh/primitives/slot for Slot documentation
 * @since 0.0.0
 * @param {import('./SlotType.js').SlotType} slot - Slot value
 * @returns {import('../Epoch/EpochType.js').EpochType} Epoch value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Slot from './primitives/Slot/index.js';
 * const slot = Slot.from(96n); // slot 96
 * const epoch = Slot.toEpoch(slot); // epoch 3 (96 / 32)
 * ```
 */
export function toEpoch(slot) {
	return Epoch.from(slot / 32n);
}
