import * as MaxFeePerGas from "../../../primitives/MaxFeePerGas/index.js";

// Network state
const currentBaseFee = 45n; // Gwei - current block's base fee
const nextBaseFee = 50n; // Gwei - estimated next block base fee

// User preferences
const maxPriorityFee = 2n; // Gwei - tip to validators
const safetyBuffer = 10n; // Gwei - buffer for base fee volatility

// Calculate maxFeePerGas
const maxFee = MaxFeePerGas.fromGwei(
	nextBaseFee + maxPriorityFee + safetyBuffer,
);
const minRequired = currentBaseFee + maxPriorityFee;
const userMaxFeeGwei = MaxFeePerGas.toGwei(maxFee);
const canBeIncluded = userMaxFeeGwei >= minRequired;
const actualBaseFee = 48n; // Gwei - actual base fee when mined
const actualPriorityFee = maxPriorityFee; // User's tip
const gasUsed = 21000n; // Gas units used

const effectiveFee = actualBaseFee + actualPriorityFee;
const actualCostGwei = effectiveFee * gasUsed;
const maxCostGwei = MaxFeePerGas.toGwei(maxFee) * gasUsed;
const conservativeMax = MaxFeePerGas.fromGwei(currentBaseFee + 1n + 5n);
const standardMax = MaxFeePerGas.fromGwei(nextBaseFee + 2n + 10n);
const aggressiveMax = MaxFeePerGas.fromGwei(nextBaseFee * 2n + 5n);
