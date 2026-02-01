/**
 * Calculate the block hash for a block header (keccak256 of RLP-encoded header)
 *
 * Supports all Ethereum hardforks:
 * - Legacy (pre-London): 15 fields
 * - EIP-1559 (London): + baseFeePerGas
 * - EIP-4895 (Shanghai): + withdrawalsRoot
 * - EIP-4844 (Cancun): + blobGasUsed, excessBlobGas, parentBeaconBlockRoot
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @see https://ethereum.org/en/developers/docs/blocks/ for block documentation
 * @since 0.1.42
 * @param {import('./BlockHeaderType.js').BlockHeaderType} header - Block header to hash
 * @returns {import('../BlockHash/BlockHashType.js').BlockHashType} 32-byte block hash
 * @throws {never}
 * @example
 * ```javascript
 * import * as BlockHeader from './primitives/BlockHeader/index.js';
 *
 * const header = BlockHeader.from({
 *   parentHash: "0x...",
 *   // ... other fields
 * });
 *
 * const hash = BlockHeader.calculateHash(header);
 * // => Uint8Array (32 bytes)
 * ```
 */
export function calculateHash(header: import("./BlockHeaderType.js").BlockHeaderType): import("../BlockHash/BlockHashType.js").BlockHashType;
//# sourceMappingURL=calculateHash.d.ts.map