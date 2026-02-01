/**
 * Maximum recursion depth to prevent stack overflow attacks
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @type {number}
 * @example
 * ```javascript
 * import { MAX_DEPTH } from './primitives/Rlp/index.js';
 * console.log(MAX_DEPTH); // => 32
 * ```
 */
export const MAX_DEPTH = 32;
