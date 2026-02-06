/**
 * Withdrawal Benchmarks: Voltaire TS
 *
 * Compares withdrawal operations - from, fromRpc, equals.
 */

import { bench, run } from "mitata";
import * as Withdrawal from "./index.js";

// ============================================================================
// Test Data - Realistic EIP-4895 withdrawal data
// ============================================================================

// Direct construction params
const withdrawalParams = {
	index: 1000000n,
	validatorIndex: 123456n,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n, // 32 ETH in Gwei
};

// RPC format (hex strings)
const rpcWithdrawal = {
	index: "0xf4240",
	validatorIndex: "0x1e240",
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: "0x773594000",
};

// Multiple withdrawals for batch testing
const withdrawalParamsList = Array.from({ length: 16 }, (_, i) => ({
	index: BigInt(1000000 + i),
	validatorIndex: BigInt(123456 + i),
	address: `0x${"0".repeat(38)}${i.toString(16).padStart(2, "0")}`,
	amount: BigInt(32000000000 + i * 1000000),
}));

const rpcWithdrawalList = Array.from({ length: 16 }, (_, i) => ({
	index: `0x${(1000000 + i).toString(16)}`,
	validatorIndex: `0x${(123456 + i).toString(16)}`,
	address: `0x${"0".repeat(38)}${i.toString(16).padStart(2, "0")}`,
	amount: `0x${(32000000000 + i * 1000000).toString(16)}`,
}));

// ============================================================================
// from Benchmarks
// ============================================================================

bench("Withdrawal.from - single", () => {
	Withdrawal.from(withdrawalParams);
});

await run();

// Address as Uint8Array
const addressBytes = new Uint8Array(20);
addressBytes.fill(0x74);
const withdrawalParamsWithBytes = {
	...withdrawalParams,
	address: addressBytes,
};

bench("Withdrawal.from - with bytes address", () => {
	Withdrawal.from(withdrawalParamsWithBytes);
});

await run();

// Number inputs
const withdrawalParamsWithNumbers = {
	index: 1000000,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000,
};

bench("Withdrawal.from - with number inputs", () => {
	Withdrawal.from(withdrawalParamsWithNumbers);
});

await run();

// ============================================================================
// fromRpc Benchmarks
// ============================================================================

bench("Withdrawal.fromRpc - single", () => {
	Withdrawal.fromRpc(rpcWithdrawal);
});

await run();

bench("Withdrawal.fromRpc - batch 16", () => {
	for (const rpc of rpcWithdrawalList) {
		Withdrawal.fromRpc(rpc);
	}
});

await run();

// ============================================================================
// equals Benchmarks
// ============================================================================

const withdrawal1 = Withdrawal.from(withdrawalParams);
const withdrawal2 = Withdrawal.from(withdrawalParams);
const withdrawal3 = Withdrawal.from({
	...withdrawalParams,
	index: 999n,
});

bench("Withdrawal.equals - same", () => {
	Withdrawal.equals(withdrawal1, withdrawal2);
});

await run();

bench("Withdrawal.equals - different", () => {
	Withdrawal.equals(withdrawal1, withdrawal3);
});

await run();

// ============================================================================
// Combined Operations
// ============================================================================

bench("Withdrawal.from + equals", () => {
	const w1 = Withdrawal.from(withdrawalParams);
	const w2 = Withdrawal.from(withdrawalParams);
	Withdrawal.equals(w1, w2);
});

await run();

bench("Withdrawal.fromRpc + equals", () => {
	const w1 = Withdrawal.fromRpc(rpcWithdrawal);
	const w2 = Withdrawal.fromRpc(rpcWithdrawal);
	Withdrawal.equals(w1, w2);
});

await run();

// ============================================================================
// Batch Construction
// ============================================================================

bench("Withdrawal.from - batch 16", () => {
	for (const params of withdrawalParamsList) {
		Withdrawal.from(params);
	}
});

await run();
