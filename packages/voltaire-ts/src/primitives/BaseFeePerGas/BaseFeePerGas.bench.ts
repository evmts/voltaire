/**
 * Benchmark: BaseFeePerGas operations
 * Tests gas fee creation, conversion, and comparison
 */

import { bench, run } from "mitata";
import { formatGwei, parseGwei } from "viem";
import * as BaseFeePerGas from "./index.js";

// Test data - typical mainnet base fees
const lowFee = 10n; // 10 wei
const mediumFee = 30000000000n; // 30 gwei
const highFee = 100000000000n; // 100 gwei

// String inputs
const feeString = "30000000000";
const gweiString = "30";

// Pre-created fees for conversion benchmarks
const fee1 = BaseFeePerGas.from(mediumFee);
const fee2 = BaseFeePerGas.from(highFee);

// ============================================================================
// from (constructor)
// ============================================================================

bench("BaseFeePerGas.from - bigint - voltaire", () => {
	BaseFeePerGas.from(mediumFee);
});

bench("BaseFeePerGas.from - number - voltaire", () => {
	BaseFeePerGas.from(30000000000);
});

bench("BaseFeePerGas.from - string - voltaire", () => {
	BaseFeePerGas.from(feeString);
});

await run();

// ============================================================================
// fromGwei
// ============================================================================

bench("BaseFeePerGas.fromGwei - voltaire", () => {
	BaseFeePerGas.fromGwei(30n);
});

bench("parseGwei - viem", () => {
	parseGwei("30");
});

await run();

// ============================================================================
// toGwei
// ============================================================================

bench("BaseFeePerGas.toGwei - voltaire", () => {
	BaseFeePerGas.toGwei(mediumFee);
});

bench("formatGwei - viem", () => {
	formatGwei(mediumFee);
});

await run();

// ============================================================================
// toWei
// ============================================================================

bench("BaseFeePerGas.toWei - voltaire", () => {
	BaseFeePerGas.toWei(mediumFee);
});

await run();

// ============================================================================
// toNumber
// ============================================================================

bench("BaseFeePerGas.toNumber - small - voltaire", () => {
	BaseFeePerGas.toNumber(lowFee);
});

bench("BaseFeePerGas.toNumber - medium - voltaire", () => {
	BaseFeePerGas.toNumber(mediumFee);
});

await run();

// ============================================================================
// toBigInt
// ============================================================================

bench("BaseFeePerGas.toBigInt - voltaire", () => {
	BaseFeePerGas.toBigInt(mediumFee);
});

await run();

// ============================================================================
// equals
// ============================================================================

bench("BaseFeePerGas.equals - same - voltaire", () => {
	BaseFeePerGas.equals(mediumFee, mediumFee);
});

bench("BaseFeePerGas.equals - different - voltaire", () => {
	BaseFeePerGas.equals(mediumFee, highFee);
});

await run();

// ============================================================================
// compare
// ============================================================================

bench("BaseFeePerGas.compare - equal - voltaire", () => {
	BaseFeePerGas.compare(mediumFee, mediumFee);
});

bench("BaseFeePerGas.compare - less than - voltaire", () => {
	BaseFeePerGas.compare(mediumFee, highFee);
});

bench("BaseFeePerGas.compare - greater than - voltaire", () => {
	BaseFeePerGas.compare(highFee, mediumFee);
});

await run();
