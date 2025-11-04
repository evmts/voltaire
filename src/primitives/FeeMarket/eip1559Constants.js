// @ts-nocheck

/**
 * EIP-1559 Constants
 */

/** Minimum base fee (wei) */
export const MIN_BASE_FEE = 7n;

/** Maximum base fee change per block (denominator for 12.5% = 1/8) */
export const BASE_FEE_CHANGE_DENOMINATOR = 8n;

/** Elasticity multiplier (gas limit = target * elasticity) */
export const ELASTICITY_MULTIPLIER = 2n;
