/**
 * Fetch a block by hash
 * @param {*} provider - EIP-1193 provider
 * @param {string} blockHash
 * @param {BlockInclude} include
 * @param {(block: *, retryOptions?: RetryOptions, signal?: AbortSignal) => Promise<any[]>} fetchBlockReceipts
 * @param {RetryOptions} [retryOptions]
 * @param {AbortSignal} [signal]
 * @returns {Promise<any>}
 */
export function fetchBlockByHash(provider: any, blockHash: string, include: BlockInclude, fetchBlockReceipts: (block: any, retryOptions?: RetryOptions, signal?: AbortSignal) => Promise<any[]>, retryOptions?: RetryOptions, signal?: AbortSignal): Promise<any>;
export type BlockInclude = import("./BlockStreamType.js").BlockInclude;
export type RetryOptions = import("./BlockStreamType.js").RetryOptions;
//# sourceMappingURL=fetchBlockByHash.d.ts.map