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
	BASE_FEE_MAX_CHANGE_DENOMINATOR,
	ELASTICITY_MULTIPLIER,
	TX_BASE_COST,
	TX_DATA_NONZERO_COST,
	TX_DATA_ZERO_COST,
	calculateEffectiveGasPrice,
	calculateIntrinsicGas,
	calculateMemoryGasCost,
	calculateNextBaseFee,
	calculatePriorityFee,
} from "../../src/typescript/primitives/gas";
import { hexToBytes } from "../../src/typescript/utils/hex";
const baseFee = 1000000000n; // 1 gwei
const gasLimit = 30000000n;
const gasTarget = gasLimit / BigInt(ELASTICITY_MULTIPLIER); // 15M

// At target (no change)
const nextBaseFeeTarget = calculateNextBaseFee(baseFee, gasTarget, gasLimit);
const gasUsedHigh = 29000000n; // ~96.7% full
const nextBaseFeeHigh = calculateNextBaseFee(baseFee, gasUsedHigh, gasLimit);
const increasePercent =
	Number(((nextBaseFeeHigh - baseFee) * 10000n) / baseFee) / 100;
const gasUsedLow = 1000000n; // ~3.3% full
const nextBaseFeeLow = calculateNextBaseFee(baseFee, gasUsedLow, gasLimit);
const decreasePercent =
	Number(((baseFee - nextBaseFeeLow) * 10000n) / baseFee) / 100;
const currentBaseFee = 50000000000n; // 50 gwei
const maxFeePerGas = 100000000000n; // 100 gwei
const maxPriorityFee = 2000000000n; // 2 gwei

const priorityFee = calculatePriorityFee(
	maxFeePerGas,
	currentBaseFee,
	maxPriorityFee,
);
const effectiveGasPrice = calculateEffectiveGasPrice(
	currentBaseFee,
	maxFeePerGas,
	maxPriorityFee,
);

// Empty transaction
const emptyData = new Uint8Array(0);
const emptyGas = calculateIntrinsicGas(emptyData);

// Data with zeros
const zeroData = new Uint8Array(100); // All zeros
const zeroGas = calculateIntrinsicGas(zeroData);

// Data with non-zeros
const nonZeroData = new Uint8Array(100).fill(1); // All non-zero
const nonZeroGas = calculateIntrinsicGas(nonZeroData);

// Real transaction data
const txData = hexToBytes(
	"0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000a",
);
const txGas = calculateIntrinsicGas(txData);

const mem1 = calculateMemoryGasCost(32n, 0n);

const mem2 = calculateMemoryGasCost(64n, 32n);

const mem3 = calculateMemoryGasCost(1024n, 0n);

const mem4 = calculateMemoryGasCost(10000n, 1024n);
const txGasLimit = 21000n;
const txGasPrice = 50000000000n; // 50 gwei
const txValue = 1000000000000000000n; // 1 ETH

const totalGasCost = txGasLimit * txGasPrice;
const totalCost = totalGasCost + txValue;

// Helper functions
function formatGwei(wei: bigint): string {
	return (Number(wei) / 1e9).toFixed(2);
}

function formatEther(wei: bigint): string {
	return (Number(wei) / 1e18).toFixed(6);
}
