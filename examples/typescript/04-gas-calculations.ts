/**
 * Example 4: Gas Calculations and EIP-1559 Fee Market
 *
 * Demonstrates:
 * - EIP-1559 base fee calculations
 * - Priority fee calculations
 * - Effective gas price
 * - Intrinsic gas costs
 * - Memory expansion costs
 */

import {
	calculateNextBaseFee,
	calculatePriorityFee,
	calculateEffectiveGasPrice,
	calculateIntrinsicGas,
	calculateMemoryGasCost,
	TX_BASE_COST,
	TX_DATA_ZERO_COST,
	TX_DATA_NONZERO_COST,
	BASE_FEE_MAX_CHANGE_DENOMINATOR,
	ELASTICITY_MULTIPLIER,
} from "../../src/typescript/primitives/gas";
import { hexToBytes } from "../../src/typescript/utils/hex";

console.log("=== Gas Calculations and EIP-1559 Fee Market ===\n");

// Example 4.1: Base Fee Adjustment (Target Usage)
console.log("4.1: Base Fee with Target Gas Usage");
const baseFee = 1000000000n; // 1 gwei
const gasLimit = 30000000n;
const gasTarget = gasLimit / BigInt(ELASTICITY_MULTIPLIER); // 15M

console.log("Current base fee:", formatGwei(baseFee), "gwei");
console.log("Gas limit:", gasLimit.toString());
console.log("Gas target:", gasTarget.toString());

// At target (no change)
const nextBaseFeeTarget = calculateNextBaseFee(baseFee, gasTarget, gasLimit);
console.log("Gas used:", gasTarget.toString(), "(at target)");
console.log("Next base fee:", formatGwei(nextBaseFeeTarget), "gwei");
console.log("Change: 0%");
console.log();

// Example 4.2: Base Fee Increase (Above Target)
console.log("4.2: Base Fee Increase (High Demand)");
const gasUsedHigh = 29000000n; // ~96.7% full
const nextBaseFeeHigh = calculateNextBaseFee(baseFee, gasUsedHigh, gasLimit);
const increasePercent =
	Number(((nextBaseFeeHigh - baseFee) * 10000n) / baseFee) / 100;

console.log("Gas used:", gasUsedHigh.toString(), "(96.7% of limit)");
console.log("Next base fee:", formatGwei(nextBaseFeeHigh), "gwei");
console.log("Change:", `+${increasePercent}%`);
console.log();

// Example 4.3: Base Fee Decrease (Below Target)
console.log("4.3: Base Fee Decrease (Low Demand)");
const gasUsedLow = 1000000n; // ~3.3% full
const nextBaseFeeLow = calculateNextBaseFee(baseFee, gasUsedLow, gasLimit);
const decreasePercent =
	Number(((baseFee - nextBaseFeeLow) * 10000n) / baseFee) / 100;

console.log("Gas used:", gasUsedLow.toString(), "(3.3% of limit)");
console.log("Next base fee:", formatGwei(nextBaseFeeLow), "gwei");
console.log("Change:", `-${decreasePercent}%`);
console.log();

// Example 4.4: Maximum Base Fee Change
console.log("4.4: Maximum Base Fee Change");
console.log(
	"Maximum increase per block:",
	`${100 / BASE_FEE_MAX_CHANGE_DENOMINATOR}%`,
);
console.log(
	"From 1 gwei:",
	formatGwei(baseFee + baseFee / BigInt(BASE_FEE_MAX_CHANGE_DENOMINATOR)),
	"gwei",
);
console.log(
	"Maximum decrease per block:",
	`${100 / BASE_FEE_MAX_CHANGE_DENOMINATOR}%`,
);
console.log(
	"From 1 gwei:",
	formatGwei(baseFee - baseFee / BigInt(BASE_FEE_MAX_CHANGE_DENOMINATOR)),
	"gwei",
);
console.log();

// Example 4.5: Priority Fee Calculation
console.log("4.5: Priority Fee (Miner Tip)");
const currentBaseFee = 50000000000n; // 50 gwei
const maxFeePerGas = 100000000000n; // 100 gwei
const maxPriorityFee = 2000000000n; // 2 gwei

const priorityFee = calculatePriorityFee(
	maxFeePerGas,
	currentBaseFee,
	maxPriorityFee,
);
console.log("Base fee:", formatGwei(currentBaseFee), "gwei");
console.log("Max fee per gas:", formatGwei(maxFeePerGas), "gwei");
console.log("Max priority fee:", formatGwei(maxPriorityFee), "gwei");
console.log("Actual priority fee:", formatGwei(priorityFee), "gwei");
console.log("Explanation: min(maxPriorityFee, maxFeePerGas - baseFee)");
console.log();

// Example 4.6: Effective Gas Price
console.log("4.6: Effective Gas Price");
const effectiveGasPrice = calculateEffectiveGasPrice(
	currentBaseFee,
	maxFeePerGas,
	maxPriorityFee,
);

console.log("Base fee:", formatGwei(currentBaseFee), "gwei");
console.log("Priority fee:", formatGwei(priorityFee), "gwei");
console.log("Effective gas price:", formatGwei(effectiveGasPrice), "gwei");
console.log("Paid to miner:", formatGwei(priorityFee), "gwei");
console.log("Burned (EIP-1559):", formatGwei(currentBaseFee), "gwei");
console.log();

// Example 4.7: Intrinsic Gas Cost
console.log("4.7: Intrinsic Gas Cost");

// Empty transaction
const emptyData = new Uint8Array(0);
const emptyGas = calculateIntrinsicGas(emptyData);
console.log("Empty transaction:", emptyGas.toString(), "gas");

// Data with zeros
const zeroData = new Uint8Array(100); // All zeros
const zeroGas = calculateIntrinsicGas(zeroData);
console.log("100 zero bytes:", zeroGas.toString(), "gas");
console.log("Cost per zero byte:", TX_DATA_ZERO_COST, "gas");

// Data with non-zeros
const nonZeroData = new Uint8Array(100).fill(1); // All non-zero
const nonZeroGas = calculateIntrinsicGas(nonZeroData);
console.log("100 non-zero bytes:", nonZeroGas.toString(), "gas");
console.log("Cost per non-zero byte:", TX_DATA_NONZERO_COST, "gas");

// Real transaction data
const txData = hexToBytes(
	"0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000a",
);
const txGas = calculateIntrinsicGas(txData);
console.log("ERC20 transfer data:", txGas.toString(), "gas");
console.log();

// Example 4.8: Memory Expansion Cost
console.log("4.8: Memory Expansion Cost");

const mem1 = calculateMemoryGasCost(32n, 0n);
console.log("Expand 0 → 32 bytes:", mem1.toString(), "gas");

const mem2 = calculateMemoryGasCost(64n, 32n);
console.log("Expand 32 → 64 bytes:", mem2.toString(), "gas");

const mem3 = calculateMemoryGasCost(1024n, 0n);
console.log("Expand 0 → 1024 bytes:", mem3.toString(), "gas");

const mem4 = calculateMemoryGasCost(10000n, 1024n);
console.log("Expand 1024 → 10000 bytes:", mem4.toString(), "gas");
console.log();

// Example 4.9: Total Transaction Cost
console.log("4.9: Total Transaction Cost Example");
const txGasLimit = 21000n;
const txGasPrice = 50000000000n; // 50 gwei
const txValue = 1000000000000000000n; // 1 ETH

const totalGasCost = txGasLimit * txGasPrice;
const totalCost = totalGasCost + txValue;

console.log("Gas limit:", txGasLimit.toString());
console.log("Gas price:", formatGwei(txGasPrice), "gwei");
console.log("Gas cost:", formatEther(totalGasCost), "ETH");
console.log("Value:", formatEther(txValue), "ETH");
console.log("Total cost:", formatEther(totalCost), "ETH");

// Helper functions
function formatGwei(wei: bigint): string {
	return (Number(wei) / 1e9).toFixed(2);
}

function formatEther(wei: bigint): string {
	return (Number(wei) / 1e18).toFixed(6);
}
