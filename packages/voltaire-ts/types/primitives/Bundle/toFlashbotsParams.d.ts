/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 */
/**
 * Converts bundle to Flashbots RPC parameters
 *
 * @param {BundleType} bundle - Bundle instance
 * @returns {object} Flashbots eth_sendBundle parameters
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * const params = Bundle.toFlashbotsParams(bundle);
 * await flashbots.request({ method: "eth_sendBundle", params: [params] });
 * ```
 */
export function toFlashbotsParams(bundle: BundleType): object;
export type BundleType = import("./BundleType.js").BundleType;
//# sourceMappingURL=toFlashbotsParams.d.ts.map