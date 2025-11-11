// @ts-nocheck

/**
 * EIP-1559 Constants
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 */

/**
 * Minimum base fee (wei)
 * @since 0.0.0
 */
export const MIN_BASE_FEE = 7n;

/**
 * Maximum base fee change per block (denominator for 12.5% = 1/8)
 * @since 0.0.0
 */
export const BASE_FEE_CHANGE_DENOMINATOR = 8n;

/**
 * Elasticity multiplier (gas limit = target * elasticity)
 * @since 0.0.0
 */
export const ELASTICITY_MULTIPLIER = 2n;
