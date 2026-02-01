/**
 * Calculate next block's base fee using EIP-1559 formula (constructor form)
 *
 * Formula:
 * - gasTarget = gasLimit / 2
 * - If gasUsed > gasTarget: baseFee increases (up to 12.5%)
 * - If gasUsed < gasTarget: baseFee decreases (up to 12.5%)
 * - If gasUsed == gasTarget: baseFee stays same
 * - Always: baseFee >= MIN_BASE_FEE (7 wei)
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {bigint} parentGasUsed - Gas used in parent block
 * @param {bigint} parentGasLimit - Gas limit of parent block
 * @param {bigint} parentBaseFee - Base fee of parent block (wei)
 * @returns {bigint} Next block's base fee (wei)
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * // Block at target (50% full): base fee unchanged
 * const baseFee1 = FeeMarket.BaseFee(15_000_000n, 30_000_000n, 1_000_000_000n);
 * // baseFee1 === 1_000_000_000n
 * ```
 */
export function BaseFee(parentGasUsed: bigint, parentGasLimit: bigint, parentBaseFee: bigint): bigint;
//# sourceMappingURL=BaseFee.d.ts.map