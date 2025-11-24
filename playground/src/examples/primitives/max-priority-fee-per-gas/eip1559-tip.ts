import * as MaxPriorityFeePerGas from "../../../primitives/MaxPriorityFeePerGas/index.js";
const baseFee = 30n; // Current base fee (Gwei) - network determines this
const priorityFee = MaxPriorityFeePerGas.fromGwei(2); // Your tip - you choose this
const maxFeePerGas = 50n; // Max you're willing to pay total (Gwei)

// Actual fee calculation
const actualBaseFee = baseFee; // Assume base fee stays constant
const actualPriorityFee = MaxPriorityFeePerGas.toGwei(priorityFee);
const totalFee = actualBaseFee + actualPriorityFee;
const refund = maxFeePerGas - totalFee;

// Conservative: minimal tip
const conservative = MaxPriorityFeePerGas.fromGwei(1);

// Standard: typical network tip
const standard = MaxPriorityFeePerGas.fromGwei(2);

// Aggressive: high priority
const aggressive = MaxPriorityFeePerGas.fromGwei(5);

// MEV protection: very high tip
const mevProtection = MaxPriorityFeePerGas.fromGwei(20);
