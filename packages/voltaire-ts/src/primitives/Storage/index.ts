/**
 * Storage Layout Utilities
 * @module Storage
 * @see https://eips.ethereum.org/EIPS/eip-7201 - Namespaced Storage Layout
 * @see https://eips.ethereum.org/EIPS/eip-8042 - Diamond Storage
 */

export { calculateErc7201 } from "./calculateErc7201.js";
export { calculateErc8042 } from "./calculateErc8042.js";
export { from } from "./from.js";
export type { StorageSlotType } from "./StorageType.js";
