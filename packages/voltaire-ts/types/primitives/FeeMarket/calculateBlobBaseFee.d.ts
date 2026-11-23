/**
 * Calculate the blob base fee for a given excess blob gas and update fraction
 * or blob schedule (EIP-4844 / EIP-7691 / EIP-7892).
 *
 * Exact execution-specs formula:
 * `fake_exponential(MIN_BLOB_BASE_FEE, excess_blob_gas, baseFeeUpdateFraction)`.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4844
 * @see https://eips.ethereum.org/EIPS/eip-7691
 * @see https://eips.ethereum.org/EIPS/eip-7892
 * @since 0.0.0
 * @param {bigint} excessBlobGas - Excess blob gas of the block
 * @param {bigint | import('./BlobScheduleType.js').BlobScheduleType} [updateFractionOrSchedule] - Update fraction or BlobSchedule (defaults to Cancun `3_338_477n`)
 * @param {bigint} [maxResult] - Optional early-exit ceiling (used by EIP-7918 reserve check)
 * @returns {bigint} Blob base fee in wei per blob gas (at least 1n)
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * FeeMarket.calculateBlobBaseFee(0n); // 1n
 * FeeMarket.calculateBlobBaseFee(10_000_000n, FeeMarket.BlobSchedule.PRAGUE); // 7n
 * ```
 */
export function calculateBlobBaseFee(excessBlobGas: bigint, updateFractionOrSchedule?: bigint | import("./BlobScheduleType.js").BlobScheduleType, maxResult?: bigint): bigint;
//# sourceMappingURL=calculateBlobBaseFee.d.ts.map