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
export const MAX_DEPTH: number;
/** EIP-7934 maximum block size before the safety margin, in bytes (10 MiB). */
export const MAX_BLOCK_SIZE: 10485760;
/** EIP-7934 block size safety margin in bytes (2 MiB). */
export const SAFETY_MARGIN: 2097152;
/** EIP-7934 maximum RLP-encoded execution block size in bytes (8 MiB). */
export const MAX_RLP_BLOCK_SIZE: number;
//# sourceMappingURL=constants.d.ts.map