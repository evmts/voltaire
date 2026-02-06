/**
 * @typedef {Object} SelectorCollision
 * @property {import("../Hex/index.js").HexType} selector - The colliding 4-byte selector
 * @property {import('./function/FunctionType.js').FunctionType[]} functions - Functions sharing this selector
 */
/**
 * Find function selector collisions in an ABI
 *
 * Detects when multiple functions in an ABI have the same 4-byte selector.
 * This can happen due to the birthday paradox with 4-byte hashes (~77,000 functions → 50% collision chance).
 *
 * @param {import('./Item/ItemType.js').ItemType[]} abi - ABI to check
 * @returns {SelectorCollision[]} Array of collisions (empty if none found)
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.1.42
 * @example
 * ```javascript
 * import { Abi } from './primitives/Abi/index.js';
 *
 * // ABI with potential collision
 * const abi = [
 *   { type: "function", name: "transfer", inputs: [{ type: "address" }, { type: "uint256" }] },
 *   { type: "function", name: "transfer", inputs: [{ type: "address" }, { type: "uint256" }] }
 * ];
 *
 * const collisions = Abi.findSelectorCollisions(abi);
 * if (collisions.length > 0) {
 *   console.warn("Selector collisions detected:", collisions);
 * }
 * ```
 */
export function findSelectorCollisions(abi: import("./Item/ItemType.js").ItemType[]): SelectorCollision[];
/**
 * Check if an ABI has any function selector collisions
 *
 * @param {import('./Item/ItemType.js').ItemType[]} abi - ABI to check
 * @returns {boolean} True if collisions exist
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.1.42
 * @example
 * ```javascript
 * import { Abi } from './primitives/Abi/index.js';
 *
 * if (Abi.hasSelectorCollisions(abi)) {
 *   throw new Error("ABI contains function selector collisions");
 * }
 * ```
 */
export function hasSelectorCollisions(abi: import("./Item/ItemType.js").ItemType[]): boolean;
export type SelectorCollision = {
    /**
     * - The colliding 4-byte selector
     */
    selector: import("../Hex/index.js").HexType;
    /**
     * - Functions sharing this selector
     */
    functions: import("./function/FunctionType.js").FunctionType[];
};
//# sourceMappingURL=findSelectorCollisions.d.ts.map