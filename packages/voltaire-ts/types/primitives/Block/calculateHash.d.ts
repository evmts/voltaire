/**
 * Calculate the block hash from a block's header
 *
 * The block hash is the keccak256 of the RLP-encoded block header.
 * This method extracts the header from the block and computes its hash.
 *
 * Supports all Ethereum hardforks:
 * - Legacy (pre-London): 15 fields
 * - EIP-1559 (London): + baseFeePerGas
 * - EIP-4895 (Shanghai): + withdrawalsRoot
 * - EIP-4844 (Cancun): + blobGasUsed, excessBlobGas, parentBeaconBlockRoot
 *
 * @see https://voltaire.tevm.sh/primitives/block for Block documentation
 * @see https://ethereum.org/en/developers/docs/blocks/ for block documentation
 * @since 0.1.42
 * @param {import('./BlockType.js').BlockType} block - Block to hash
 * @returns {import('../BlockHash/BlockHashType.js').BlockHashType} 32-byte block hash
 * @throws {never}
 * @example
 * ```javascript
 * import * as Block from './primitives/Block/index.js';
 *
 * const block = Block.from({
 *   header: blockHeader,
 *   body: blockBody,
 *   hash: "0x...",
 *   size: 1024n,
 * });
 *
 * const computedHash = Block.calculateHash(block);
 * // => Uint8Array (32 bytes)
 *
 * // Verify the stored hash matches the computed hash
 * import * as Hash from './primitives/Hash/index.js';
 * const isValid = Hash.equals(block.hash, computedHash);
 * ```
 */
export function calculateHash(block: import("./BlockType.js").BlockType): import("../BlockHash/BlockHashType.js").BlockHashType;
//# sourceMappingURL=calculateHash.d.ts.map