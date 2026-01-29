/**
 * TraceResult Benchmarks: Voltaire TS
 *
 * Compares performance of trace result operations.
 * TraceResult contains the output from debug_traceTransaction.
 */

import { bench, run } from "mitata";
import type { AddressType } from "../Address/AddressType.js";
import * as CallTrace from "../CallTrace/index.js";
import * as StructLog from "../StructLog/index.js";
import * as TraceResult from "./index.js";

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
const CONTRACT = hexToAddress("0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc");

// Test data
const RETURN_VALUE = hexToBytes(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const INPUT_DATA = hexToBytes(
	"0xa9059cbb000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dc0000000000000000000000000000000000000000000000000000000005f5e100",
);

// Simple struct logs
const structLogs = [
	StructLog.from({
		pc: 0,
		op: "PUSH1",
		gas: 1000000n,
		gasCost: 3n,
		depth: 1,
		stack: [],
	}),
	StructLog.from({
		pc: 2,
		op: "ADD",
		gas: 999997n,
		gasCost: 3n,
		depth: 1,
		stack: ["0x01", "0x02"],
	}),
	StructLog.from({
		pc: 3,
		op: "RETURN",
		gas: 999994n,
		gasCost: 0n,
		depth: 1,
		stack: ["0x03"],
	}),
];

// Call trace
const callTrace = CallTrace.from({
	type: "CALL",
	from: CALLER,
	to: CONTRACT,
	gas: 100000n,
	gasUsed: 50000n,
	input: INPUT_DATA,
	output: RETURN_VALUE,
	value: 0n,
});

// Simple result (no trace data)
const simpleResult = TraceResult.from({
	gas: 50000n,
	failed: false,
	returnValue: RETURN_VALUE,
});

// Result with struct logs
const structLogResult = TraceResult.from({
	gas: 50000n,
	failed: false,
	returnValue: RETURN_VALUE,
	structLogs,
});

// Result with call trace
const callTraceResult = TraceResult.from({
	gas: 50000n,
	failed: false,
	returnValue: RETURN_VALUE,
	callTrace,
});

// Failed result
const failedResult = TraceResult.from({
	gas: 100000n,
	failed: true,
	returnValue: new Uint8Array(0),
});

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - simple (no trace) - voltaire", () => {
	TraceResult.from({
		gas: 50000n,
		failed: false,
		returnValue: RETURN_VALUE,
	});
});

bench("from - with structLogs (3) - voltaire", () => {
	TraceResult.from({
		gas: 50000n,
		failed: false,
		returnValue: RETURN_VALUE,
		structLogs,
	});
});

bench("from - with callTrace - voltaire", () => {
	TraceResult.from({
		gas: 50000n,
		failed: false,
		returnValue: RETURN_VALUE,
		callTrace,
	});
});

bench("from - failed - voltaire", () => {
	TraceResult.from({
		gas: 100000n,
		failed: true,
		returnValue: new Uint8Array(0),
	});
});

await run();

// ============================================================================
// getStructLogs benchmarks
// ============================================================================

bench("getStructLogs - no logs - voltaire", () => {
	TraceResult.getStructLogs(simpleResult);
});

bench("getStructLogs - with logs - voltaire", () => {
	TraceResult.getStructLogs(structLogResult);
});

await run();

// ============================================================================
// getCallTrace benchmarks
// ============================================================================

bench("getCallTrace - no trace - voltaire", () => {
	TraceResult.getCallTrace(simpleResult);
});

bench("getCallTrace - with trace - voltaire", () => {
	TraceResult.getCallTrace(callTraceResult);
});

await run();

// ============================================================================
// Combined operations
// ============================================================================

bench("from + getStructLogs - voltaire", () => {
	const result = TraceResult.from({
		gas: 50000n,
		failed: false,
		returnValue: RETURN_VALUE,
		structLogs,
	});
	TraceResult.getStructLogs(result);
});

bench("from + getCallTrace - voltaire", () => {
	const result = TraceResult.from({
		gas: 50000n,
		failed: false,
		returnValue: RETURN_VALUE,
		callTrace,
	});
	TraceResult.getCallTrace(result);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

// Simulate processing multiple trace results
const results = [simpleResult, structLogResult, callTraceResult, failedResult];

bench("getStructLogs - 4 results - voltaire", () => {
	for (const result of results) {
		TraceResult.getStructLogs(result);
	}
});

bench("getCallTrace - 4 results - voltaire", () => {
	for (const result of results) {
		TraceResult.getCallTrace(result);
	}
});

await run();
