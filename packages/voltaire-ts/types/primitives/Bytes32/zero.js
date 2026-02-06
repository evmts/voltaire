import { SIZE } from "./constants.js";
/**
 * Create a zero-filled Bytes32
 *
 * @returns {import('./Bytes32Type.js').Bytes32Type} New Bytes32 with all zeros
 *
 * @example
 * ```typescript
 * const empty = Bytes32.zero();
 * ```
 */
export function zero() {
    return /** @type {import('./Bytes32Type.js').Bytes32Type} */ (new Uint8Array(SIZE));
}
