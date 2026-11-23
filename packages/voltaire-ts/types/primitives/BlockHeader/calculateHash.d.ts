/**
 * Calculate the block hash for a block header (keccak256 of RLP-encoded header)
 *
 * Supports all Ethereum hardforks:
 * - Legacy (pre-London): 15 fields
 * - EIP-1559 (London): + baseFeePerGas
 * - EIP-4895 (Shanghai): + withdrawalsRoot
 * - EIP-4844 (Cancun): + blobGasUsed, excessBlobGas, parentBeaconBlockRoot
 * - EIP-7685 (Prague and Osaka): + requestsHash
 * - EIP-7928 (Amsterdam): + blockAccessListHash
 *
 * Fork fields form an ordered suffix, and the three Cancun fields must appear together.
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @see https://ethereum.org/en/developers/docs/blocks/ for block documentation
 * @since 0.1.42
 * @param {import('./BlockHeaderType.js').BlockHeaderType} header - Block header to hash
 * @returns {import('../BlockHash/BlockHashType.js').BlockHashType} 32-byte block hash
 * @throws {Error} If a required fork field is missing
 * @example
 * ```javascript
 * import { BlockHeader } from "@tevm/voltaire";
 *
 * const zeroHash = `0x${"00".repeat(32)}`;
 * const header = BlockHeader.from({
 *   parentHash: zeroHash,
 *   ommersHash: zeroHash,
 *   beneficiary: `0x${"00".repeat(20)}`,
 *   stateRoot: zeroHash,
 *   transactionsRoot: zeroHash,
 *   receiptsRoot: zeroHash,
 *   logsBloom: new Uint8Array(256),
 *   difficulty: 0n,
 *   number: 1n,
 *   gasLimit: 30000000n,
 *   gasUsed: 0n,
 *   timestamp: 1764798551n,
 *   extraData: new Uint8Array(0),
 *   mixHash: zeroHash,
 *   nonce: new Uint8Array(8),
 *   baseFeePerGas: 7n,
 *   withdrawalsRoot: zeroHash,
 *   blobGasUsed: 0n,
 *   excessBlobGas: 0n,
 *   parentBeaconBlockRoot: zeroHash,
 *   requestsHash: "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
 * });
 * const hash = BlockHeader.calculateHash(header);
 * ```
 */
export function calculateHash(header: import("./BlockHeaderType.js").BlockHeaderType): import("../BlockHash/BlockHashType.js").BlockHashType;
//# sourceMappingURL=calculateHash.d.ts.map