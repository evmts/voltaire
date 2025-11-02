/**
 * Fee Market Types and Utilities
 *
 * EIP-1559 & EIP-4844 fee market calculations with type-safe operations.
 *
 * @example
 * ```typescript
 * import * as FeeMarket from './fee-market.js';
 *
 * // Calculate next base fee (EIP-1559)
 * const nextBaseFee = FeeMarket.calculateBaseFee(
 *   30_000_000n, // parent gas used
 *   30_000_000n, // parent gas limit
 *   1_000_000_000n // parent base fee (1 gwei)
 * );
 *
 * // Calculate blob base fee (EIP-4844)
 * const blobBaseFee = FeeMarket.calculateBlobBaseFee(393216n);
 *
 * // With convenience API
 * const state: FeeMarket.State = {
 *   gasUsed: 30_000_000n,
 *   gasLimit: 30_000_000n,
 *   baseFee: 1_000_000_000n,
 *   excessBlobGas: 0n,
 *   blobGasUsed: 0n
 * };
 * const nextState = FeeMarket.State.next.call(state);
 * ```
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * EIP-1559 Constants
 */
export namespace Eip1559 {
  /** Minimum base fee (wei) */
  export const MIN_BASE_FEE = 7n;

  /** Maximum base fee change per block (denominator for 12.5% = 1/8) */
  export const BASE_FEE_CHANGE_DENOMINATOR = 8n;

  /** Elasticity multiplier (gas limit = target * elasticity) */
  export const ELASTICITY_MULTIPLIER = 2n;
}

/**
 * EIP-4844 Constants
 */
export namespace Eip4844 {
  /** Minimum blob base fee (wei) */
  export const MIN_BLOB_BASE_FEE = 1n;

  /** Blob base fee exponential update denominator */
  export const BLOB_BASE_FEE_UPDATE_FRACTION = 3338477n;

  /** Target blob gas per block (3 blobs worth) */
  export const TARGET_BLOB_GAS_PER_BLOCK = 393216n;

  /** Gas per blob (2^17 = 128 KiB) */
  export const BLOB_GAS_PER_BLOB = 131072n;

  /** Maximum blobs per block */
  export const MAX_BLOBS_PER_BLOCK = 6n;

  /** Maximum blob gas per block */
  export const MAX_BLOB_GAS_PER_BLOCK = MAX_BLOBS_PER_BLOCK * BLOB_GAS_PER_BLOB;
}

// ============================================================================
// Core Types
// ============================================================================

/**
 * Complete fee market state for a block
 */
export type State = {
  /** Gas used in block */
  gasUsed: bigint;
  /** Gas limit of block */
  gasLimit: bigint;
  /** Base fee per gas (wei) */
  baseFee: bigint;
  /** Excess blob gas accumulated */
  excessBlobGas: bigint;
  /** Blob gas used in block */
  blobGasUsed: bigint;
};

/**
 * EIP-1559 specific state
 */
export type Eip1559State = {
  /** Gas used in block */
  gasUsed: bigint;
  /** Gas limit of block */
  gasLimit: bigint;
  /** Base fee per gas (wei) */
  baseFee: bigint;
};

/**
 * EIP-4844 specific state
 */
export type Eip4844State = {
  /** Excess blob gas accumulated */
  excessBlobGas: bigint;
  /** Blob gas used in block */
  blobGasUsed: bigint;
};

/**
 * Transaction fee parameters
 */
export type TxFeeParams = {
  /** Maximum fee per gas willing to pay (wei) */
  maxFeePerGas: bigint;
  /** Maximum priority fee per gas (tip to miner, wei) */
  maxPriorityFeePerGas: bigint;
  /** Current block base fee (wei) */
  baseFee: bigint;
};

/**
 * Blob transaction fee parameters (EIP-4844)
 */
export type BlobTxFeeParams = TxFeeParams & {
  /** Maximum fee per blob gas (wei) */
  maxFeePerBlobGas: bigint;
  /** Current blob base fee (wei) */
  blobBaseFee: bigint;
  /** Number of blobs in transaction */
  blobCount: bigint;
};

/**
 * Calculated transaction fee breakdown
 */
export type TxFee = {
  /** Effective gas price paid (wei per gas) */
  effectiveGasPrice: bigint;
  /** Priority fee paid (wei per gas) */
  priorityFee: bigint;
  /** Base fee paid (wei per gas) */
  baseFee: bigint;
};

/**
 * Calculated blob transaction fee breakdown
 */
export type BlobTxFee = TxFee & {
  /** Blob gas price paid (wei per blob gas) */
  blobGasPrice: bigint;
  /** Total blob fee (wei) */
  totalBlobFee: bigint;
};

// ============================================================================
// Base Fee Calculations (EIP-1559)
// ============================================================================

/**
 * Calculate next block's base fee using EIP-1559 formula (standard form)
 *
 * Formula:
 * - gasTarget = gasLimit / 2
 * - If gasUsed > gasTarget: baseFee increases (up to 12.5%)
 * - If gasUsed < gasTarget: baseFee decreases (up to 12.5%)
 * - If gasUsed == gasTarget: baseFee stays same
 * - Always: baseFee >= MIN_BASE_FEE (7 wei)
 *
 * @param parentGasUsed - Gas used in parent block
 * @param parentGasLimit - Gas limit of parent block
 * @param parentBaseFee - Base fee of parent block (wei)
 * @returns Next block's base fee (wei)
 *
 * @example
 * ```typescript
 * // Block at target (50% full): base fee unchanged
 * const baseFee1 = calculateBaseFee(15_000_000n, 30_000_000n, 1_000_000_000n);
 * // baseFee1 === 1_000_000_000n
 *
 * // Full block: base fee increases
 * const baseFee2 = calculateBaseFee(30_000_000n, 30_000_000n, 1_000_000_000n);
 * // baseFee2 === 1_125_000_000n (12.5% increase)
 *
 * // Empty block: base fee decreases
 * const baseFee3 = calculateBaseFee(0n, 30_000_000n, 1_000_000_000n);
 * // baseFee3 === 1_000_000_000n (unchanged at 0)
 * ```
 */
export function calculateBaseFee(
  parentGasUsed: bigint,
  parentGasLimit: bigint,
  parentBaseFee: bigint,
): bigint {
  // Target is 50% of gas limit (elasticity multiplier = 2)
  const parentGasTarget = parentGasLimit / Eip1559.ELASTICITY_MULTIPLIER;

  // Empty block: base fee stays same
  if (parentGasUsed === 0n) {
    return parentBaseFee;
  }

  // At target: base fee stays same
  if (parentGasUsed === parentGasTarget) {
    return parentBaseFee;
  }

  let newBaseFee = parentBaseFee;

  if (parentGasUsed > parentGasTarget) {
    // Block used more than target: increase base fee
    const gasUsedDelta = parentGasUsed - parentGasTarget;
    // baseFee * delta / target / 8 (max 12.5% increase)
    const baseFeeDelta =
      (parentBaseFee * gasUsedDelta) /
      parentGasTarget /
      Eip1559.BASE_FEE_CHANGE_DENOMINATOR;
    newBaseFee = parentBaseFee + (baseFeeDelta > 0n ? baseFeeDelta : 1n);
  } else {
    // Block used less than target: decrease base fee
    const gasUsedDelta = parentGasTarget - parentGasUsed;
    // baseFee * delta / target / 8 (max 12.5% decrease)
    const baseFeeDelta =
      (parentBaseFee * gasUsedDelta) /
      parentGasTarget /
      Eip1559.BASE_FEE_CHANGE_DENOMINATOR;
    const delta = baseFeeDelta > 0n ? baseFeeDelta : 1n;
    newBaseFee = parentBaseFee > delta ? parentBaseFee - delta : Eip1559.MIN_BASE_FEE;
  }

  // Enforce minimum base fee
  return newBaseFee < Eip1559.MIN_BASE_FEE ? Eip1559.MIN_BASE_FEE : newBaseFee;
}

// ============================================================================
// Blob Fee Calculations (EIP-4844)
// ============================================================================

/**
 * Calculate blob base fee using EIP-4844 formula (standard form)
 *
 * Formula: fakeExponential(MIN_BLOB_BASE_FEE, excessBlobGas, BLOB_BASE_FEE_UPDATE_FRACTION)
 *
 * Uses Taylor series to approximate: MIN_BLOB_BASE_FEE * e^(excessBlobGas / UPDATE_FRACTION)
 *
 * @param excessBlobGas - Excess blob gas from previous blocks
 * @returns Blob base fee (wei per blob gas)
 *
 * @example
 * ```typescript
 * // No excess: minimum fee
 * const fee1 = calculateBlobBaseFee(0n);
 * // fee1 === 1n
 *
 * // At target: fee increases
 * const fee2 = calculateBlobBaseFee(393216n);
 * // fee2 > 1n
 *
 * // High excess: exponentially higher fee
 * const fee3 = calculateBlobBaseFee(1_000_000n);
 * // fee3 >> fee2
 * ```
 */
export function calculateBlobBaseFee(excessBlobGas: bigint): bigint {
  return fakeExponential(
    Eip4844.MIN_BLOB_BASE_FEE,
    excessBlobGas,
    Eip4844.BLOB_BASE_FEE_UPDATE_FRACTION,
  );
}

/**
 * Calculate excess blob gas for next block using EIP-4844 formula (standard form)
 *
 * Formula: max(0, parentExcessBlobGas + parentBlobGasUsed - TARGET_BLOB_GAS_PER_BLOCK)
 *
 * @param parentExcessBlobGas - Excess blob gas from parent block
 * @param parentBlobGasUsed - Blob gas used in parent block
 * @returns Excess blob gas for next block
 *
 * @example
 * ```typescript
 * // Below target: no excess
 * const excess1 = calculateExcessBlobGas(0n, 131072n); // 1 blob
 * // excess1 === 0n
 *
 * // At target: no new excess
 * const excess2 = calculateExcessBlobGas(0n, 393216n); // 3 blobs
 * // excess2 === 0n
 *
 * // Above target: accumulate excess
 * const excess3 = calculateExcessBlobGas(0n, 786432n); // 6 blobs
 * // excess3 === 393216n (3 blobs worth)
 * ```
 */
export function calculateExcessBlobGas(
  parentExcessBlobGas: bigint,
  parentBlobGasUsed: bigint,
): bigint {
  const total = parentExcessBlobGas + parentBlobGasUsed;

  if (total < Eip4844.TARGET_BLOB_GAS_PER_BLOCK) {
    return 0n;
  }

  return total - Eip4844.TARGET_BLOB_GAS_PER_BLOCK;
}

/**
 * Approximate exponential function using Taylor series
 * Internal helper for EIP-4844 blob fee calculation
 *
 * Approximates: factor * e^(numerator / denominator)
 * Using Taylor series: factor * (1 + x + x²/2! + x³/3! + ...)
 * where x = numerator / denominator
 *
 * @param factor - Base factor (MIN_BLOB_BASE_FEE)
 * @param numerator - Exponent numerator (excessBlobGas)
 * @param denominator - Exponent denominator (BLOB_BASE_FEE_UPDATE_FRACTION)
 * @returns Approximated result
 */
function fakeExponential(factor: bigint, numerator: bigint, denominator: bigint): bigint {
  let output = 0n;
  let numeratorAccum = factor * denominator;
  let i = 1n;

  // Taylor series: sum of (numerator^i) / (denominator^i * i!)
  while (numeratorAccum > 0n && i <= 256n) {
    output += numeratorAccum;
    numeratorAccum = (numeratorAccum * numerator) / (denominator * i);
    i += 1n;
  }

  return output / denominator;
}

// ============================================================================
// Transaction Fee Calculations
// ============================================================================

/**
 * Calculate effective transaction fee (standard form)
 *
 * Formula:
 * - effectiveGasPrice = min(maxFeePerGas, baseFee + maxPriorityFeePerGas)
 * - priorityFee = effectiveGasPrice - baseFee
 *
 * @param params - Transaction fee parameters
 * @returns Calculated fee breakdown
 *
 * @example
 * ```typescript
 * const fee = calculateTxFee({
 *   maxFeePerGas: 2_000_000_000n, // 2 gwei max
 *   maxPriorityFeePerGas: 1_000_000_000n, // 1 gwei tip
 *   baseFee: 800_000_000n // 0.8 gwei base
 * });
 * // fee.effectiveGasPrice === 1_800_000_000n
 * // fee.priorityFee === 1_000_000_000n (full tip paid)
 * // fee.baseFee === 800_000_000n
 * ```
 */
export function calculateTxFee(params: TxFeeParams): TxFee {
  const { maxFeePerGas, maxPriorityFeePerGas, baseFee } = params;

  // Effective gas price is capped by maxFeePerGas
  const effectiveGasPrice =
    baseFee + maxPriorityFeePerGas < maxFeePerGas
      ? baseFee + maxPriorityFeePerGas
      : maxFeePerGas;

  // Priority fee is what remains after base fee
  const priorityFee = effectiveGasPrice > baseFee ? effectiveGasPrice - baseFee : 0n;

  return {
    effectiveGasPrice,
    priorityFee,
    baseFee,
  };
}

/**
 * Calculate blob transaction fee (standard form)
 *
 * Combines regular gas fee with blob gas fee.
 *
 * @param params - Blob transaction fee parameters
 * @returns Calculated fee breakdown including blob fees
 *
 * @example
 * ```typescript
 * const fee = calculateBlobTxFee({
 *   maxFeePerGas: 2_000_000_000n,
 *   maxPriorityFeePerGas: 1_000_000_000n,
 *   baseFee: 800_000_000n,
 *   maxFeePerBlobGas: 10_000_000n, // 10 wei per blob gas
 *   blobBaseFee: 5_000_000n, // 5 wei per blob gas
 *   blobCount: 3n
 * });
 * // fee.blobGasPrice === 5_000_000n
 * // fee.totalBlobFee === 1_966_080_000_000n (3 blobs * 131072 gas/blob * 5 wei)
 * ```
 */
export function calculateBlobTxFee(params: BlobTxFeeParams): BlobTxFee {
  const { maxFeePerBlobGas, blobBaseFee, blobCount } = params;

  // Calculate regular gas fee
  const txFee = calculateTxFee(params);

  // Blob gas price is capped by maxFeePerBlobGas
  const blobGasPrice = blobBaseFee < maxFeePerBlobGas ? blobBaseFee : maxFeePerBlobGas;

  // Total blob fee = blobGasPrice * gasPerBlob * blobCount
  const totalBlobFee = blobGasPrice * Eip4844.BLOB_GAS_PER_BLOB * blobCount;

  return {
    ...txFee,
    blobGasPrice,
    totalBlobFee,
  };
}

/**
 * Check if transaction can be included in block (standard form)
 *
 * Transaction is valid if:
 * - maxFeePerGas >= baseFee
 * - For blob txs: maxFeePerBlobGas >= blobBaseFee
 *
 * @param params - Transaction fee parameters
 * @returns true if transaction meets minimum fee requirements
 *
 * @example
 * ```typescript
 * const canInclude = canIncludeTx({
 *   maxFeePerGas: 1_000_000_000n,
 *   maxPriorityFeePerGas: 100_000_000n,
 *   baseFee: 900_000_000n
 * });
 * // canInclude === true (maxFee >= baseFee)
 * ```
 */
export function canIncludeTx(params: TxFeeParams | BlobTxFeeParams): boolean {
  const { maxFeePerGas, baseFee } = params;

  // Must pay at least base fee
  if (maxFeePerGas < baseFee) {
    return false;
  }

  // For blob txs, must also pay blob base fee
  if ("maxFeePerBlobGas" in params) {
    return params.maxFeePerBlobGas >= params.blobBaseFee;
  }

  return true;
}

// ============================================================================
// State Operations
// ============================================================================

/**
 * Calculate next block's fee market state (internal, takes this)
 * @internal
 */
export function _nextState(this: State): State {
  return nextState(this);
}

/**
 * Get current blob base fee (internal, takes this)
 * @internal
 */
export function _getBlobBaseFee(this: State): bigint {
  return calculateBlobBaseFee(this.excessBlobGas);
}

/**
 * Get gas target for block (internal, takes this)
 * @internal
 */
export function _getGasTarget(this: State): bigint {
  return this.gasLimit / Eip1559.ELASTICITY_MULTIPLIER;
}

/**
 * Check if block is above gas target (internal, takes this)
 * @internal
 */
export function _isAboveGasTarget(this: State): boolean {
  return this.gasUsed > this.gasLimit / Eip1559.ELASTICITY_MULTIPLIER;
}

/**
 * Check if block is above blob gas target (internal, takes this)
 * @internal
 */
export function _isAboveBlobGasTarget(this: State): boolean {
  return this.blobGasUsed > Eip4844.TARGET_BLOB_GAS_PER_BLOCK;
}

export namespace State {
  /**
   * Calculate next block's fee market state (convenience form)
   *
   * @example
   * ```typescript
   * const state: State = {
   *   gasUsed: 20_000_000n,
   *   gasLimit: 30_000_000n,
   *   baseFee: 1_000_000_000n,
   *   excessBlobGas: 0n,
   *   blobGasUsed: 262144n // 2 blobs
   * };
   * const nextState = State.next.call(state);
   * // nextState.baseFee !== state.baseFee (gas below target)
   * // nextState.excessBlobGas === 0n (below blob target)
   * ```
   */
  export const next = _nextState;

  /**
   * Get current blob base fee (convenience form)
   */
  export const getBlobBaseFee = _getBlobBaseFee;

  /**
   * Get gas target for block (convenience form)
   */
  export const getGasTarget = _getGasTarget;

  /**
   * Check if block is above gas target (convenience form)
   */
  export const isAboveGasTarget = _isAboveGasTarget;

  /**
   * Check if block is above blob gas target (convenience form)
   */
  export const isAboveBlobGasTarget = _isAboveBlobGasTarget;
}

/**
 * Calculate next block's fee market state (standard form)
 *
 * Updates both EIP-1559 base fee and EIP-4844 blob base fee components.
 *
 * @param state - Current block state
 * @returns Next block's state
 *
 * @example
 * ```typescript
 * const currentState: State = {
 *   gasUsed: 20_000_000n,
 *   gasLimit: 30_000_000n,
 *   baseFee: 1_000_000_000n,
 *   excessBlobGas: 0n,
 *   blobGasUsed: 262144n // 2 blobs
 * };
 * const nextState = nextState(currentState);
 * ```
 */
export function nextState(state: State): State {
  const nextBaseFee = calculateBaseFee(state.gasUsed, state.gasLimit, state.baseFee);
  const nextExcessBlobGas = calculateExcessBlobGas(state.excessBlobGas, state.blobGasUsed);

  return {
    gasUsed: 0n, // Reset for next block
    gasLimit: state.gasLimit, // Typically unchanged
    baseFee: nextBaseFee,
    excessBlobGas: nextExcessBlobGas,
    blobGasUsed: 0n, // Reset for next block
  };
}

/**
 * Calculate series of future base fees (standard form)
 *
 * Useful for estimating fee trends over multiple blocks.
 *
 * @param initialState - Starting state
 * @param blocks - Number of blocks to project
 * @param avgGasUsed - Average gas used per block
 * @param avgBlobGasUsed - Average blob gas used per block
 * @returns Array of future base fees
 *
 * @example
 * ```typescript
 * const fees = projectBaseFees(
 *   { gasUsed: 15_000_000n, gasLimit: 30_000_000n, baseFee: 1_000_000_000n,
 *     excessBlobGas: 0n, blobGasUsed: 0n },
 *   10, // next 10 blocks
 *   25_000_000n, // expect 83% full blocks
 *   262144n // expect 2 blobs per block
 * );
 * // fees.length === 10
 * // fees show increasing trend (above target usage)
 * ```
 */
export function projectBaseFees(
  initialState: State,
  blocks: number,
  avgGasUsed: bigint,
  avgBlobGasUsed: bigint = 0n,
): bigint[] {
  const fees: bigint[] = [];
  let state = { ...initialState };

  for (let i = 0; i < blocks; i++) {
    // Simulate block with average usage
    state = {
      ...state,
      gasUsed: avgGasUsed,
      blobGasUsed: avgBlobGasUsed,
    };

    // Calculate next state
    state = nextState(state);
    fees.push(state.baseFee);
  }

  return fees;
}

// ============================================================================
// Validation & Utilities
// ============================================================================

/**
 * Validate transaction fee parameters
 *
 * @param params - Transaction fee parameters
 * @returns Validation errors, empty array if valid
 */
export function validateTxFeeParams(params: TxFeeParams | BlobTxFeeParams): string[] {
  const errors: string[] = [];

  if (params.maxFeePerGas < 0n) {
    errors.push("maxFeePerGas must be non-negative");
  }

  if (params.maxPriorityFeePerGas < 0n) {
    errors.push("maxPriorityFeePerGas must be non-negative");
  }

  if (params.maxPriorityFeePerGas > params.maxFeePerGas) {
    errors.push("maxPriorityFeePerGas cannot exceed maxFeePerGas");
  }

  if (params.baseFee < 0n) {
    errors.push("baseFee must be non-negative");
  }

  if ("maxFeePerBlobGas" in params) {
    if (params.maxFeePerBlobGas < 0n) {
      errors.push("maxFeePerBlobGas must be non-negative");
    }

    if (params.blobBaseFee < 0n) {
      errors.push("blobBaseFee must be non-negative");
    }

    if (params.blobCount < 1n || params.blobCount > Eip4844.MAX_BLOBS_PER_BLOCK) {
      errors.push(
        `blobCount must be between 1 and ${Eip4844.MAX_BLOBS_PER_BLOCK}`,
      );
    }
  }

  return errors;
}

/**
 * Validate block state
 *
 * @param state - Block state
 * @returns Validation errors, empty array if valid
 */
export function validateState(state: State): string[] {
  const errors: string[] = [];

  if (state.gasUsed < 0n) {
    errors.push("gasUsed must be non-negative");
  }

  if (state.gasLimit <= 0n) {
    errors.push("gasLimit must be positive");
  }

  if (state.gasUsed > state.gasLimit) {
    errors.push("gasUsed cannot exceed gasLimit");
  }

  if (state.baseFee < Eip1559.MIN_BASE_FEE) {
    errors.push(`baseFee must be at least ${Eip1559.MIN_BASE_FEE}`);
  }

  if (state.excessBlobGas < 0n) {
    errors.push("excessBlobGas must be non-negative");
  }

  if (state.blobGasUsed < 0n) {
    errors.push("blobGasUsed must be non-negative");
  }

  if (state.blobGasUsed > Eip4844.MAX_BLOB_GAS_PER_BLOCK) {
    errors.push(
      `blobGasUsed cannot exceed ${Eip4844.MAX_BLOB_GAS_PER_BLOCK}`,
    );
  }

  return errors;
}

/**
 * Convert wei to gwei for display
 */
export function weiToGwei(wei: bigint): string {
  const gwei = Number(wei) / 1_000_000_000;
  return gwei.toFixed(9);
}

/**
 * Convert gwei to wei
 */
export function gweiToWei(gwei: number): bigint {
  return BigInt(Math.floor(gwei * 1_000_000_000));
}
