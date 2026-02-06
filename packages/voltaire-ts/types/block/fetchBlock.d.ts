/**
 * Fetch a block by number with optional transactions
 * @param {*} provider - EIP-1193 provider
 * @param {bigint} blockNumber
 * @param {BlockInclude} include
 * @param {(block: *, retryOptions?: RetryOptions, signal?: AbortSignal) => Promise<any[]>} fetchBlockReceipts
 * @param {RetryOptions} [retryOptions]
 * @param {AbortSignal} [signal]
 * @returns {Promise<any>}
 */
export function fetchBlock(provider: any, blockNumber: bigint, include: BlockInclude, fetchBlockReceipts: (block: any, retryOptions?: RetryOptions, signal?: AbortSignal) => Promise<any[]>, retryOptions?: RetryOptions, signal?: AbortSignal): Promise<any>;
export type BlockInclude = import("./BlockStreamType.js").BlockInclude;
export type RetryOptions = import("./BlockStreamType.js").RetryOptions;
//# sourceMappingURL=fetchBlock.d.ts.map