/**
 * CallTrace Benchmarks: Voltaire TS
 *
 * Compares performance of call trace operations.
 * CallTrace represents execution traces from debug_traceTransaction.
 */

import { bench, run } from "mitata";
import type { AddressType } from "../Address/AddressType.js";
import * as CallTrace from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

function hexToBytes(hex: string): Uint8Array {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function hexToAddress(hex: string): AddressType {
	return hexToBytes(hex) as AddressType;
}

// Test addresses
const CALLER = hexToAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
const CONTRACT_A = hexToAddress("0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc");
const CONTRACT_B = hexToAddress("0x1111111111111111111111111111111111111111");
const CONTRACT_C = hexToAddress("0x2222222222222222222222222222222222222222");

// Test input/output data
const INPUT_DATA = hexToBytes(
	"0xa9059cbb000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dc0000000000000000000000000000000000000000000000000000000005f5e100",
);
const OUTPUT_DATA = hexToBytes(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const EMPTY_DATA = new Uint8Array(0);

// Simple call trace (no nested calls)
const simpleTrace = CallTrace.from({
	type: "CALL",
	from: CALLER,
	to: CONTRACT_A,
	gas: 100000n,
	gasUsed: 50000n,
	input: INPUT_DATA,
	output: OUTPUT_DATA,
	value: 0n,
});

// Call trace with error
const errorTrace = CallTrace.from({
	type: "CALL",
	from: CALLER,
	to: CONTRACT_A,
	gas: 100000n,
	gasUsed: 100000n,
	input: INPUT_DATA,
	output: EMPTY_DATA,
	value: 0n,
	error: "execution reverted",
});

// Nested call trace (depth 2)
const nestedTrace = CallTrace.from({
	type: "CALL",
	from: CALLER,
	to: CONTRACT_A,
	gas: 200000n,
	gasUsed: 150000n,
	input: INPUT_DATA,
	output: OUTPUT_DATA,
	value: 0n,
	calls: [
		CallTrace.from({
			type: "CALL",
			from: CONTRACT_A,
			to: CONTRACT_B,
			gas: 100000n,
			gasUsed: 50000n,
			input: INPUT_DATA,
			output: OUTPUT_DATA,
			value: 0n,
		}),
	],
});

// Deep nested trace (depth 4)
const deepTrace = CallTrace.from({
	type: "CALL",
	from: CALLER,
	to: CONTRACT_A,
	gas: 500000n,
	gasUsed: 400000n,
	input: INPUT_DATA,
	output: OUTPUT_DATA,
	value: 0n,
	calls: [
		CallTrace.from({
			type: "CALL",
			from: CONTRACT_A,
			to: CONTRACT_B,
			gas: 300000n,
			gasUsed: 250000n,
			input: INPUT_DATA,
			output: OUTPUT_DATA,
			value: 0n,
			calls: [
				CallTrace.from({
					type: "STATICCALL",
					from: CONTRACT_B,
					to: CONTRACT_C,
					gas: 200000n,
					gasUsed: 100000n,
					input: INPUT_DATA,
					output: OUTPUT_DATA,
					value: 0n,
					calls: [
						CallTrace.from({
							type: "DELEGATECALL",
							from: CONTRACT_C,
							to: CONTRACT_A,
							gas: 100000n,
							gasUsed: 50000n,
							input: INPUT_DATA,
							output: OUTPUT_DATA,
							value: 0n,
						}),
					],
				}),
			],
		}),
		CallTrace.from({
			type: "CALL",
			from: CONTRACT_A,
			to: CONTRACT_C,
			gas: 100000n,
			gasUsed: 50000n,
			input: INPUT_DATA,
			output: OUTPUT_DATA,
			value: 1000000000000000000n,
		}),
	],
});

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - simple CALL - voltaire", () => {
	CallTrace.from({
		type: "CALL",
		from: CALLER,
		to: CONTRACT_A,
		gas: 100000n,
		gasUsed: 50000n,
		input: INPUT_DATA,
		output: OUTPUT_DATA,
		value: 0n,
	});
});

bench("from - with error - voltaire", () => {
	CallTrace.from({
		type: "CALL",
		from: CALLER,
		to: CONTRACT_A,
		gas: 100000n,
		gasUsed: 100000n,
		input: INPUT_DATA,
		output: EMPTY_DATA,
		value: 0n,
		error: "execution reverted",
	});
});

bench("from - STATICCALL - voltaire", () => {
	CallTrace.from({
		type: "STATICCALL",
		from: CALLER,
		to: CONTRACT_A,
		gas: 100000n,
		gasUsed: 30000n,
		input: INPUT_DATA,
		output: OUTPUT_DATA,
		value: 0n,
	});
});

bench("from - DELEGATECALL - voltaire", () => {
	CallTrace.from({
		type: "DELEGATECALL",
		from: CALLER,
		to: CONTRACT_A,
		gas: 100000n,
		gasUsed: 40000n,
		input: INPUT_DATA,
		output: OUTPUT_DATA,
		value: 0n,
	});
});

await run();

// ============================================================================
// getCalls benchmarks
// ============================================================================

bench("getCalls - no nested - voltaire", () => {
	CallTrace.getCalls(simpleTrace);
});

bench("getCalls - 1 nested - voltaire", () => {
	CallTrace.getCalls(nestedTrace);
});

bench("getCalls - deep nested - voltaire", () => {
	CallTrace.getCalls(deepTrace);
});

await run();

// ============================================================================
// hasError benchmarks
// ============================================================================

bench("hasError - no error - voltaire", () => {
	CallTrace.hasError(simpleTrace);
});

bench("hasError - has error - voltaire", () => {
	CallTrace.hasError(errorTrace);
});

bench("hasError - deep nested - voltaire", () => {
	CallTrace.hasError(deepTrace);
});

await run();

// ============================================================================
// flatten benchmarks
// ============================================================================

bench("flatten - simple (1 call) - voltaire", () => {
	CallTrace.flatten(simpleTrace);
});

bench("flatten - nested (2 calls) - voltaire", () => {
	CallTrace.flatten(nestedTrace);
});

bench("flatten - deep (5 calls) - voltaire", () => {
	CallTrace.flatten(deepTrace);
});

await run();

// ============================================================================
// Combined operations
// ============================================================================

bench("flatten + hasError - deep trace - voltaire", () => {
	const all = CallTrace.flatten(deepTrace);
	for (const trace of all) {
		CallTrace.hasError(trace);
	}
});

await run();
