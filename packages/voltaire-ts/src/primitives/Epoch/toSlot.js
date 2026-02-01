import * as Slot from "../Slot/index.js";

/**
 * Convert Epoch to the first Slot of that epoch
 *
 * Each epoch contains 32 slots. This function returns the first slot: slot = epoch * 32.
 *
 * @see https://voltaire.tevm.sh/primitives/epoch for Epoch documentation
 * @since 0.0.0
 * @param {import('./EpochType.js').EpochType} epoch - Epoch value
 * @returns {import('../Slot/SlotType.js').SlotType} First slot of the epoch
 * @throws {never}
 * @example
 * ```javascript
 * import * as Epoch from './primitives/Epoch/index.js';
 * const epoch = Epoch.from(3n);
 * const slot = Epoch.toSlot(epoch); // 96n (3 * 32)
 * ```
 */
export function toSlot(epoch) {
	return Slot.from(epoch * 32n);
}
