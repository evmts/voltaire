/**
 * Benchmark: EffectiveGasPrice operations
 * Tests EIP-1559 effective gas price calculation
 */

import { bench, run } from "mitata";
import * as EffectiveGasPrice from "./index.js";

// Test data - typical EIP-1559 transaction values
const baseFee = 30000000000n; // 30 gwei
const maxFee = 50000000000n; // 50 gwei
const maxPriorityFee = 2000000000n; // 2 gwei

// Calculated effective price
const effectivePrice = 32000000000n; // baseFee + priorityFee (capped)

// Pre-created for conversion benchmarks
const price1 = EffectiveGasPrice.from(effectivePrice);
const price2 = EffectiveGasPrice.from(50000000000n);

// ============================================================================
// from (constructor)
// ============================================================================

bench("EffectiveGasPrice.from - bigint - voltaire", () => {
	EffectiveGasPrice.from(effectivePrice);
});

bench("EffectiveGasPrice.from - number - voltaire", () => {
	EffectiveGasPrice.from(32000000000);
});

bench("EffectiveGasPrice.from - string - voltaire", () => {
	EffectiveGasPrice.from("32000000000");
});

await run();

// ============================================================================
// calculate (EIP-1559 effective price calculation)
// ============================================================================

bench("EffectiveGasPrice.calculate - voltaire", () => {
	EffectiveGasPrice.calculate({
		baseFeePerGas: baseFee,
		maxFeePerGas: maxFee,
		maxPriorityFeePerGas: maxPriorityFee,
	});
});

await run();

// Test edge cases
bench("EffectiveGasPrice.calculate - priority exceeds max - voltaire", () => {
	EffectiveGasPrice.calculate({
		baseFeePerGas: baseFee,
		maxFeePerGas: 35000000000n, // Lower than baseFee + priority
		maxPriorityFeePerGas: 10000000000n, // 10 gwei
	});
});

bench("EffectiveGasPrice.calculate - zero priority - voltaire", () => {
	EffectiveGasPrice.calculate({
		baseFeePerGas: baseFee,
		maxFeePerGas: maxFee,
		maxPriorityFeePerGas: 0n,
	});
});

await run();

// ============================================================================
// fromGwei
// ============================================================================

bench("EffectiveGasPrice.fromGwei - voltaire", () => {
	EffectiveGasPrice.fromGwei(32n);
});

await run();

// ============================================================================
// toGwei
// ============================================================================

bench("EffectiveGasPrice.toGwei - voltaire", () => {
	EffectiveGasPrice.toGwei(effectivePrice);
});

await run();

// ============================================================================
// toWei
// ============================================================================

bench("EffectiveGasPrice.toWei - voltaire", () => {
	EffectiveGasPrice.toWei(effectivePrice);
});

await run();

// ============================================================================
// equals
// ============================================================================

bench("EffectiveGasPrice.equals - same - voltaire", () => {
	EffectiveGasPrice.equals(effectivePrice, effectivePrice);
});

bench("EffectiveGasPrice.equals - different - voltaire", () => {
	EffectiveGasPrice.equals(effectivePrice, maxFee);
});

await run();

// ============================================================================
// compare
// ============================================================================

bench("EffectiveGasPrice.compare - equal - voltaire", () => {
	EffectiveGasPrice.compare(effectivePrice, effectivePrice);
});

bench("EffectiveGasPrice.compare - less than - voltaire", () => {
	EffectiveGasPrice.compare(effectivePrice, maxFee);
});

bench("EffectiveGasPrice.compare - greater than - voltaire", () => {
	EffectiveGasPrice.compare(maxFee, effectivePrice);
});

await run();

// ============================================================================
// Full workflow: calculate + convert
// ============================================================================

bench("EffectiveGasPrice workflow - calculate + toGwei - voltaire", () => {
	const price = EffectiveGasPrice.calculate({
		baseFeePerGas: baseFee,
		maxFeePerGas: maxFee,
		maxPriorityFeePerGas: maxPriorityFee,
	});
	EffectiveGasPrice.toGwei(price);
});

await run();
