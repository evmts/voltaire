/**
 * EVM Gas constants and calculations
 */

// Transaction base costs
export const TX_BASE_COST = 21000;
export const TX_DATA_ZERO_COST = 4;
export const TX_DATA_NONZERO_COST = 16;
export const TX_CREATE_COST = 32000;
export const TX_ACCESS_LIST_ADDRESS_COST = 2400;
export const TX_ACCESS_LIST_STORAGE_KEY_COST = 1900;

// Storage costs
export const SSTORE_SET_COST = 20000;
export const SSTORE_RESET_COST = 5000;
export const SSTORE_CLEARS_SCHEDULE = 15000;

// Memory costs
export const MEMORY_COST = 3;
export const MEMORY_QUADRATIC_COEFF = 512;

// Call costs
export const CALL_STIPEND = 2300;
export const CALL_VALUE_TRANSFER_COST = 9000;
export const CALL_NEW_ACCOUNT_COST = 25000;

// EIP-1559 constants
export const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8;
export const ELASTICITY_MULTIPLIER = 2;
export const BASE_FEE_INITIAL = 1000000000; // 1 gwei

/**
 * Calculate the next block's base fee according to EIP-1559
 * @param parentBaseFee - Parent block's base fee in wei
 * @param parentGasUsed - Gas used in parent block
 * @param parentGasLimit - Gas limit of parent block
 * @returns Next block's base fee in wei
 */
export function calculateNextBaseFee(
  parentBaseFee: bigint,
  parentGasUsed: bigint,
  parentGasLimit: bigint
): bigint {
  const gasTarget = parentGasLimit / BigInt(ELASTICITY_MULTIPLIER);

  if (parentGasUsed === gasTarget) {
    return parentBaseFee;
  }

  if (parentGasUsed > gasTarget) {
    const gasUsedDelta = parentGasUsed - gasTarget;
    const baseFeePerGasDelta = (parentBaseFee * gasUsedDelta) / gasTarget / BigInt(BASE_FEE_MAX_CHANGE_DENOMINATOR);
    return parentBaseFee + (baseFeePerGasDelta > 0n ? baseFeePerGasDelta : 1n);
  }

  const gasUsedDelta = gasTarget - parentGasUsed;
  const baseFeePerGasDelta = (parentBaseFee * gasUsedDelta) / gasTarget / BigInt(BASE_FEE_MAX_CHANGE_DENOMINATOR);
  const newBaseFee = parentBaseFee - baseFeePerGasDelta;
  return newBaseFee > 0n ? newBaseFee : 0n;
}

/**
 * Calculate priority fee (miner tip)
 * @param maxFeePerGas - Maximum fee per gas willing to pay
 * @param baseFee - Current block's base fee
 * @param maxPriorityFeePerGas - Maximum priority fee per gas
 * @returns Actual priority fee per gas
 */
export function calculatePriorityFee(
  maxFeePerGas: bigint,
  baseFee: bigint,
  maxPriorityFeePerGas: bigint
): bigint {
  const maxPriorityFee = maxFeePerGas - baseFee;
  return maxPriorityFee < maxPriorityFeePerGas ? maxPriorityFee : maxPriorityFeePerGas;
}

/**
 * Calculate effective gas price for a transaction
 * @param baseFee - Current block's base fee
 * @param maxFeePerGas - Maximum fee per gas
 * @param maxPriorityFeePerGas - Maximum priority fee per gas
 * @returns Effective gas price
 */
export function calculateEffectiveGasPrice(
  baseFee: bigint,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint
): bigint {
  const priorityFee = calculatePriorityFee(maxFeePerGas, baseFee, maxPriorityFeePerGas);
  return baseFee + priorityFee;
}

/**
 * Calculate intrinsic gas cost for transaction data
 * @param data - Transaction data
 * @returns Intrinsic gas cost
 */
export function calculateIntrinsicGas(data: Uint8Array): bigint {
  let cost = BigInt(TX_BASE_COST);

  for (const byte of data) {
    if (byte === 0) {
      cost += BigInt(TX_DATA_ZERO_COST);
    } else {
      cost += BigInt(TX_DATA_NONZERO_COST);
    }
  }

  return cost;
}

/**
 * Calculate memory expansion gas cost
 * @param newSize - New memory size in bytes
 * @param currentSize - Current memory size in bytes
 * @returns Gas cost for memory expansion
 */
export function calculateMemoryGasCost(newSize: bigint, currentSize: bigint): bigint {
  if (newSize <= currentSize) {
    return 0n;
  }

  const newWords = (newSize + 31n) / 32n;
  const currentWords = (currentSize + 31n) / 32n;

  const newCost = (BigInt(MEMORY_COST) * newWords) + (newWords * newWords / BigInt(MEMORY_QUADRATIC_COEFF));
  const currentCost = (BigInt(MEMORY_COST) * currentWords) + (currentWords * currentWords / BigInt(MEMORY_QUADRATIC_COEFF));

  return newCost - currentCost;
}
