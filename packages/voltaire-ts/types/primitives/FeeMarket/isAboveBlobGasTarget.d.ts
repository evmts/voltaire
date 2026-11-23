/**
 * Check if block is above blob gas target (takes this)
 *
 * Without `context`, the target is Cancun's 3 blobs (backwards compatible).
 * With `context`, the target is `schedule.target` blobs of the resolved fork
 * (Prague/Osaka 6, BPO1 10, BPO2 14).
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('./FeeMarketType.js').FeeMarketType} state - Current block state
 * @param {import('./BlobScheduleType.js').BlobForkContext} [context] - Optional fork, timestamp, or schedule context
 * @returns {boolean} True if blob gas used exceeds target
 * @throws {InvalidRangeError} If `context` names an unknown or pre-Cancun fork
 * @throws {InvalidFormatError} If `context.timestamp` is an invalid number
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const state = { excessBlobGas: 0n, blobGasUsed: 524288n, gasUsed: 0n, gasLimit: 30000000n, baseFee: 1000000000n };
 * const isAbove = FeeMarket.isAboveBlobGasTarget(state);
 * ```
 */
export function isAboveBlobGasTarget(state: import("./FeeMarketType.js").FeeMarketType, context?: import("./BlobScheduleType.js").BlobForkContext): boolean;
//# sourceMappingURL=isAboveBlobGasTarget.d.ts.map