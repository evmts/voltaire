/**
 * Converts bundle to Flashbots RPC parameters
 *
 * @param {BundleType} bundle - Bundle instance
 * @returns {{ txs: string[], blockNumber?: string, minTimestamp?: number, maxTimestamp?: number, revertingTxHashes?: string[] }} Flashbots eth_sendBundle parameters
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * const params = Bundle.toFlashbotsParams(bundle);
 * await flashbots.request({ method: "eth_sendBundle", params: [params] });
 * ```
 */
export function toFlashbotsParams(bundle: BundleType): {
    txs: string[];
    blockNumber?: string;
    minTimestamp?: number;
    maxTimestamp?: number;
    revertingTxHashes?: string[];
};
export type BundleType = import("./BundleType.js").BundleType;
//# sourceMappingURL=toFlashbotsParams.d.ts.map