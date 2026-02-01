/**
 * @typedef {object} BlockHeaderParams
 * @property {string | Uint8Array} parentHash
 * @property {string | Uint8Array} ommersHash
 * @property {string | Uint8Array} beneficiary
 * @property {string | Uint8Array} stateRoot
 * @property {string | Uint8Array} transactionsRoot
 * @property {string | Uint8Array} receiptsRoot
 * @property {Uint8Array} logsBloom
 * @property {bigint} difficulty
 * @property {bigint} number
 * @property {bigint} gasLimit
 * @property {bigint} gasUsed
 * @property {bigint} timestamp
 * @property {Uint8Array} extraData
 * @property {string | Uint8Array} mixHash
 * @property {Uint8Array} nonce
 * @property {bigint} [baseFeePerGas]
 * @property {string | Uint8Array} [withdrawalsRoot]
 * @property {bigint} [blobGasUsed]
 * @property {bigint} [excessBlobGas]
 * @property {string | Uint8Array} [parentBeaconBlockRoot]
 */
/**
 * Create BlockHeader from components
 *
 * @param {BlockHeaderParams} params - BlockHeader parameters
 * @returns {import('./BlockHeaderType.js').BlockHeaderType} BlockHeader
 *
 * @example
 * ```typescript
 * const header = BlockHeader.from({
 *   parentHash: "0x1234...",
 *   ommersHash: "0x5678...",
 *   beneficiary: "0xabcd...",
 *   stateRoot: "0xef01...",
 *   transactionsRoot: "0x2345...",
 *   receiptsRoot: "0x6789...",
 *   logsBloom: new Uint8Array(256),
 *   difficulty: 0n,
 *   number: 12345n,
 *   gasLimit: 30000000n,
 *   gasUsed: 21000n,
 *   timestamp: 1234567890n,
 *   extraData: new Uint8Array(0),
 *   mixHash: "0xabcd...",
 *   nonce: new Uint8Array(8),
 *   baseFeePerGas: 1000000000n, // EIP-1559
 *   withdrawalsRoot: "0xdef0...", // Post-Shanghai
 *   blobGasUsed: 262144n, // EIP-4844
 *   excessBlobGas: 0n, // EIP-4844
 *   parentBeaconBlockRoot: "0x0123..." // EIP-4788
 * });
 * ```
 */
export function from({ parentHash, ommersHash, beneficiary, stateRoot, transactionsRoot, receiptsRoot, logsBloom, difficulty, number, gasLimit, gasUsed, timestamp, extraData, mixHash, nonce, baseFeePerGas, withdrawalsRoot, blobGasUsed, excessBlobGas, parentBeaconBlockRoot, }: BlockHeaderParams): import("./BlockHeaderType.js").BlockHeaderType;
export type BlockHeaderParams = {
    parentHash: string | Uint8Array;
    ommersHash: string | Uint8Array;
    beneficiary: string | Uint8Array;
    stateRoot: string | Uint8Array;
    transactionsRoot: string | Uint8Array;
    receiptsRoot: string | Uint8Array;
    logsBloom: Uint8Array;
    difficulty: bigint;
    number: bigint;
    gasLimit: bigint;
    gasUsed: bigint;
    timestamp: bigint;
    extraData: Uint8Array;
    mixHash: string | Uint8Array;
    nonce: Uint8Array;
    baseFeePerGas?: bigint | undefined;
    withdrawalsRoot?: string | Uint8Array<ArrayBufferLike> | undefined;
    blobGasUsed?: bigint | undefined;
    excessBlobGas?: bigint | undefined;
    parentBeaconBlockRoot?: string | Uint8Array<ArrayBufferLike> | undefined;
};
//# sourceMappingURL=from.d.ts.map