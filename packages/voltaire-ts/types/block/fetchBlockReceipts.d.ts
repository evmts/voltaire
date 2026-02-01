/**
 * Create a fetchBlockReceipts function with memoized support state
 * @param {*} provider - EIP-1193 provider
 * @returns {(block: *, retryOptions?: RetryOptions, signal?: AbortSignal) => Promise<any[]>}
 */
export function createFetchBlockReceipts(provider: any): (block: any, retryOptions?: RetryOptions, signal?: AbortSignal) => Promise<any[]>;
export type RetryOptions = import("./BlockStreamType.js").RetryOptions;
//# sourceMappingURL=fetchBlockReceipts.d.ts.map