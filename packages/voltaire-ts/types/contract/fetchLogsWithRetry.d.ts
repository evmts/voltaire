/**
 * @typedef {import('./EventStreamType.js').RetryOptions} RetryOptions
 * @typedef {import('../provider/TypedProvider.js').TypedProvider} TypedProvider
 */
/**
 * @typedef {object} FetchLogsContext
 * @property {TypedProvider} provider
 * @property {string} addressHex
 * @property {(string | null)[]} topicsHex
 */
/**
 * Fetch logs with retry logic
 * @param {FetchLogsContext} context
 * @param {bigint} fromBlock
 * @param {bigint} toBlock
 * @param {RetryOptions} [retryOptions]
 * @param {AbortSignal} [signal]
 * @returns {Promise<{logs: any[], shouldReduceChunk: boolean}>}
 */
export function fetchLogsWithRetry(context: FetchLogsContext, fromBlock: bigint, toBlock: bigint, retryOptions?: RetryOptions, signal?: AbortSignal): Promise<{
    logs: any[];
    shouldReduceChunk: boolean;
}>;
export type RetryOptions = import("./EventStreamType.js").RetryOptions;
export type TypedProvider = import("../provider/TypedProvider.js").TypedProvider;
export type FetchLogsContext = {
    provider: TypedProvider;
    addressHex: string;
    topicsHex: (string | null)[];
};
//# sourceMappingURL=fetchLogsWithRetry.d.ts.map