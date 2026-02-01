/**
 * Gas Performance Benchmarks - SLICE 2
 *
 * Benchmarks for GasLimit and GasPrice operations.
 */

import { bench, run } from "mitata";
import * as Gas from "./index.js";

// ============================================================================
// Test Data - GasLimit
// ============================================================================

const SIMPLE_TRANSFER_GAS = 21000;
const ERC20_TRANSFER_GAS = 65000;
const CONTRACT_DEPLOY_GAS = 3_000_000;
const BLOCK_GAS_LIMIT = 30_000_000;

// ============================================================================
// Test Data - GasPrice
// ============================================================================

const LOW_GAS_PRICE = 1_000_000_000n; // 1 gwei
const MEDIUM_GAS_PRICE = 50_000_000_000n; // 50 gwei
const HIGH_GAS_PRICE = 200_000_000_000n; // 200 gwei

// ============================================================================
// GasLimit: Construction
// ============================================================================

bench("GasLimit.from(number) - simple transfer - voltaire", () => {
	Gas.gasLimitFrom(SIMPLE_TRANSFER_GAS);
});

bench("GasLimit.from(number) - erc20 transfer - voltaire", () => {
	Gas.gasLimitFrom(ERC20_TRANSFER_GAS);
});

bench("GasLimit.from(number) - contract deploy - voltaire", () => {
	Gas.gasLimitFrom(CONTRACT_DEPLOY_GAS);
});

bench("GasLimit.from(number) - block limit - voltaire", () => {
	Gas.gasLimitFrom(BLOCK_GAS_LIMIT);
});

await run();

bench("GasLimit.from(bigint) - voltaire", () => {
	Gas.gasLimitFrom(BigInt(SIMPLE_TRANSFER_GAS));
});

bench("GasLimit.from(string) - voltaire", () => {
	Gas.gasLimitFrom("21000");
});

await run();

// ============================================================================
// GasLimit: Conversion
// ============================================================================

bench("GasLimit.toNumber - voltaire", () => {
	Gas.gasLimitToNumber(SIMPLE_TRANSFER_GAS);
});

bench("GasLimit.toBigInt - voltaire", () => {
	Gas.gasLimitToBigInt(SIMPLE_TRANSFER_GAS);
});

await run();

// ============================================================================
// GasPrice: Construction
// ============================================================================

bench("GasPrice.from(bigint) - low - voltaire", () => {
	Gas.gasPriceFrom(LOW_GAS_PRICE);
});

bench("GasPrice.from(bigint) - medium - voltaire", () => {
	Gas.gasPriceFrom(MEDIUM_GAS_PRICE);
});

bench("GasPrice.from(bigint) - high - voltaire", () => {
	Gas.gasPriceFrom(HIGH_GAS_PRICE);
});

await run();

bench("GasPrice.fromGwei(1) - voltaire", () => {
	Gas.gasPriceFromGwei(1n);
});

bench("GasPrice.fromGwei(50) - voltaire", () => {
	Gas.gasPriceFromGwei(50n);
});

bench("GasPrice.fromGwei(200) - voltaire", () => {
	Gas.gasPriceFromGwei(200n);
});

await run();

// ============================================================================
// GasPrice: Conversion
// ============================================================================

bench("GasPrice.toBigInt - voltaire", () => {
	Gas.gasPriceToBigInt(LOW_GAS_PRICE);
});

bench("GasPrice.toGwei - voltaire", () => {
	Gas.gasPriceToGwei(LOW_GAS_PRICE);
});

await run();

// ============================================================================
// Constants
// ============================================================================

bench("access SIMPLE_TRANSFER constant - voltaire", () => {
	Gas.SIMPLE_TRANSFER;
});

bench("access ERC20_TRANSFER constant - voltaire", () => {
	Gas.ERC20_TRANSFER;
});

bench("access DEFAULT_LIMIT constant - voltaire", () => {
	Gas.DEFAULT_LIMIT;
});

await run();

// ============================================================================
// Round-trips
// ============================================================================

bench("roundtrip number->gasLimit->number - voltaire", () => {
	Gas.gasLimitToNumber(SIMPLE_TRANSFER_GAS);
});

bench("roundtrip bigint->gasPrice->bigint - voltaire", () => {
	Gas.gasPriceToBigInt(LOW_GAS_PRICE);
});

bench("roundtrip gwei->gasPrice->gwei - voltaire", () => {
	const price = Gas.gasPriceFromGwei(50n);
	Gas._gasPriceToGwei.call(price);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const gasLimits = [21000, 45000, 65000, 100000, 200000, 500000, 1000000];

bench("Batch gasLimitFrom (7 values) - voltaire", () => {
	for (const limit of gasLimits) {
		Gas.gasLimitFrom(limit);
	}
});

await run();

const gasPrices = [1n, 5n, 10n, 25n, 50n, 100n, 200n]; // gwei

bench("Batch gasPriceFromGwei (7 values) - voltaire", () => {
	for (const gwei of gasPrices) {
		Gas.gasPriceFromGwei(gwei);
	}
});

await run();
