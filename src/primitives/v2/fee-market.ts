// EIP-1559 & EIP-4844 Fee Market Implementation
// References:
// - EIP-1559: https://eips.ethereum.org/EIPS/eip-1559
// - EIP-4844: https://eips.ethereum.org/EIPS/eip-4844

// EIP-1559 Constants
export const MIN_BASE_FEE = 7n; // Minimum base fee (wei)
export const BASE_FEE_CHANGE_DENOMINATOR = 8n; // Max 12.5% change per block

// EIP-4844 Constants
export const MIN_BLOB_BASE_FEE = 1n; // Minimum blob base fee (wei)
export const BLOB_BASE_FEE_UPDATE_FRACTION = 3338477n; // Exponential update denominator
export const TARGET_BLOB_GAS_PER_BLOCK = 393216n; // 3 blobs worth
export const BLOB_GAS_PER_BLOB = 131072n; // 2^17

/**
 * Calculate next block's base fee using EIP-1559 formula
 *
 * Formula:
 * - If parentGasUsed > parentGasTarget:
 *   baseFee = parentBaseFee + parentBaseFee * (parentGasUsed - parentGasTarget) / parentGasTarget / 8
 * - If parentGasUsed < parentGasTarget:
 *   baseFee = parentBaseFee - parentBaseFee * (parentGasTarget - parentGasUsed) / parentGasTarget / 8
 * - Else: baseFee = parentBaseFee
 * - Always: baseFee >= MIN_BASE_FEE
 *
 * @param parentGasUsed - Gas used in parent block
 * @param parentGasLimit - Gas limit of parent block
 * @param parentBaseFee - Base fee of parent block (wei)
 * @returns Next block's base fee (wei)
 */
export const calculateBaseFee = (
  parentGasUsed: bigint,
  parentGasLimit: bigint,
  parentBaseFee: bigint,
): bigint => {
  // Target is 50% of gas limit (elasticity multiplier = 2)
  const parentGasTarget = parentGasLimit / 2n;

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
      (parentBaseFee * gasUsedDelta) / parentGasTarget / BASE_FEE_CHANGE_DENOMINATOR;
    newBaseFee = parentBaseFee + (baseFeeDelta > 0n ? baseFeeDelta : 1n);
  } else {
    // Block used less than target: decrease base fee
    const gasUsedDelta = parentGasTarget - parentGasUsed;
    // baseFee * delta / target / 8 (max 12.5% decrease)
    const baseFeeDelta =
      (parentBaseFee * gasUsedDelta) / parentGasTarget / BASE_FEE_CHANGE_DENOMINATOR;
    const delta = baseFeeDelta > 0n ? baseFeeDelta : 1n;
    newBaseFee = parentBaseFee > delta ? parentBaseFee - delta : MIN_BASE_FEE;
  }

  // Enforce minimum base fee
  return newBaseFee < MIN_BASE_FEE ? MIN_BASE_FEE : newBaseFee;
};

/**
 * Calculate blob base fee using EIP-4844 formula
 *
 * Formula: fakeExponential(MIN_BLOB_BASE_FEE, excessBlobGas, BLOB_BASE_FEE_UPDATE_FRACTION)
 *
 * fakeExponential approximates: factor * e^(numerator / denominator)
 * Using Taylor series: factor * (1 + x + x^2/2 + x^3/6 + ...)
 * where x = numerator / denominator
 *
 * @param excessBlobGas - Excess blob gas from previous blocks
 * @returns Blob base fee (wei)
 */
export const calculateBlobBaseFee = (excessBlobGas: bigint): bigint => {
  // fakeExponential(MIN_BLOB_BASE_FEE, excessBlobGas, BLOB_BASE_FEE_UPDATE_FRACTION)
  return fakeExponential(MIN_BLOB_BASE_FEE, excessBlobGas, BLOB_BASE_FEE_UPDATE_FRACTION);
};

/**
 * Calculate excess blob gas for next block using EIP-4844 formula
 *
 * Formula:
 * excessBlobGas = max(0, parentExcessBlobGas + parentBlobGasUsed - TARGET_BLOB_GAS_PER_BLOCK)
 *
 * @param parentExcessBlobGas - Excess blob gas from parent block
 * @param parentBlobGasUsed - Blob gas used in parent block
 * @returns Excess blob gas for next block
 */
export const calculateExcessBlobGas = (
  parentExcessBlobGas: bigint,
  parentBlobGasUsed: bigint,
): bigint => {
  const total = parentExcessBlobGas + parentBlobGasUsed;

  if (total < TARGET_BLOB_GAS_PER_BLOCK) {
    return 0n;
  }

  return total - TARGET_BLOB_GAS_PER_BLOCK;
};

/**
 * Approximate exponential function using Taylor series
 * Internal helper for EIP-4844 blob fee calculation
 *
 * Approximates: factor * e^(numerator / denominator)
 *
 * @param factor - Base factor (MIN_BLOB_BASE_FEE)
 * @param numerator - Exponent numerator (excessBlobGas)
 * @param denominator - Exponent denominator (BLOB_BASE_FEE_UPDATE_FRACTION)
 * @returns Approximated result
 */
const fakeExponential = (factor: bigint, numerator: bigint, denominator: bigint): bigint => {
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
};

export const FeeMarket = {
  calculateBaseFee,
  calculateBlobBaseFee,
  calculateExcessBlobGas,
} as const;
