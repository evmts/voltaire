/**
 * StructLog Benchmarks: Voltaire TS
 *
 * Compares performance of struct log operations.
 * StructLog represents EVM execution step data from debug_traceTransaction.
 */

import { bench, run } from "mitata";
import * as StructLog from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Simple opcode (PUSH1)
const pushLog = StructLog.from({
	pc: 0,
	op: "PUSH1",
	gas: 1000000n,
	gasCost: 3n,
	depth: 1,
	stack: [],
});

// Stack operation (ADD)
const addLog = StructLog.from({
	pc: 10,
	op: "ADD",
	gas: 999990n,
	gasCost: 3n,
	depth: 1,
	stack: [
		"0x0000000000000000000000000000000000000000000000000000000000000001",
		"0x0000000000000000000000000000000000000000000000000000000000000002",
	],
});

// Memory operation (MSTORE)
const mstoreLog = StructLog.from({
	pc: 20,
	op: "MSTORE",
	gas: 999980n,
	gasCost: 6n,
	depth: 1,
	stack: [
		"0x0000000000000000000000000000000000000000000000000000000000000000",
		"0x0000000000000000000000000000000000000000000000000000000000000060",
	],
	memory: [
		"0000000000000000000000000000000000000000000000000000000000000000",
		"0000000000000000000000000000000000000000000000000000000000000000",
		"0000000000000000000000000000000000000000000000000000000000000080",
	],
});

// Storage operation (SLOAD)
const sloadLog = StructLog.from({
	pc: 30,
	op: "SLOAD",
	gas: 999900n,
	gasCost: 2100n,
	depth: 1,
	stack: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
	storage: {
		"0x0000000000000000000000000000000000000000000000000000000000000001":
			"0x0000000000000000000000000000000000000000000000000000000005f5e100",
	},
});

// Call operation (CALL)
const callLog = StructLog.from({
	pc: 100,
	op: "CALL",
	gas: 900000n,
	gasCost: 100n,
	depth: 1,
	stack: [
		"0x0000000000000000000000000000000000000000000000000000000000000000", // retSize
		"0x0000000000000000000000000000000000000000000000000000000000000000", // retOffset
		"0x0000000000000000000000000000000000000000000000000000000000000044", // argSize
		"0x0000000000000000000000000000000000000000000000000000000000000000", // argOffset
		"0x0000000000000000000000000000000000000000000000000000000000000000", // value
		"0x000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dc", // address
		"0x00000000000000000000000000000000000000000000000000000000000186a0", // gas
	],
	memory: [
		"a9059cbb000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dc",
		"0000000000000000000000000000000000000000000000000000000005f5e100",
	],
});

// Deep nested operation
const deepLog = StructLog.from({
	pc: 500,
	op: "RETURN",
	gas: 100000n,
	gasCost: 0n,
	depth: 4,
	stack: [
		"0x0000000000000000000000000000000000000000000000000000000000000020",
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	],
	memory: ["0000000000000000000000000000000000000000000000000000000000000001"],
});

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - PUSH1 (minimal) - voltaire", () => {
	StructLog.from({
		pc: 0,
		op: "PUSH1",
		gas: 1000000n,
		gasCost: 3n,
		depth: 1,
		stack: [],
	});
});

bench("from - ADD (with stack) - voltaire", () => {
	StructLog.from({
		pc: 10,
		op: "ADD",
		gas: 999990n,
		gasCost: 3n,
		depth: 1,
		stack: [
			"0x0000000000000000000000000000000000000000000000000000000000000001",
			"0x0000000000000000000000000000000000000000000000000000000000000002",
		],
	});
});

bench("from - MSTORE (with memory) - voltaire", () => {
	StructLog.from({
		pc: 20,
		op: "MSTORE",
		gas: 999980n,
		gasCost: 6n,
		depth: 1,
		stack: [
			"0x0000000000000000000000000000000000000000000000000000000000000000",
			"0x0000000000000000000000000000000000000000000000000000000000000060",
		],
		memory: [
			"0000000000000000000000000000000000000000000000000000000000000000",
			"0000000000000000000000000000000000000000000000000000000000000000",
			"0000000000000000000000000000000000000000000000000000000000000080",
		],
	});
});

bench("from - SLOAD (with storage) - voltaire", () => {
	StructLog.from({
		pc: 30,
		op: "SLOAD",
		gas: 999900n,
		gasCost: 2100n,
		depth: 1,
		stack: [
			"0x0000000000000000000000000000000000000000000000000000000000000001",
		],
		storage: {
			"0x0000000000000000000000000000000000000000000000000000000000000001":
				"0x0000000000000000000000000000000000000000000000000000000005f5e100",
		},
	});
});

await run();

bench("from - CALL (full) - voltaire", () => {
	StructLog.from({
		pc: 100,
		op: "CALL",
		gas: 900000n,
		gasCost: 100n,
		depth: 1,
		stack: [
			"0x0000000000000000000000000000000000000000000000000000000000000000",
			"0x0000000000000000000000000000000000000000000000000000000000000000",
			"0x0000000000000000000000000000000000000000000000000000000000000044",
			"0x0000000000000000000000000000000000000000000000000000000000000000",
			"0x0000000000000000000000000000000000000000000000000000000000000000",
			"0x000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dc",
			"0x00000000000000000000000000000000000000000000000000000000000186a0",
		],
		memory: [
			"a9059cbb000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dc",
			"0000000000000000000000000000000000000000000000000000000005f5e100",
		],
	});
});

await run();

// ============================================================================
// toOpStep benchmarks
// ============================================================================

bench("toOpStep - PUSH1 - voltaire", () => {
	StructLog.toOpStep(pushLog);
});

bench("toOpStep - ADD - voltaire", () => {
	StructLog.toOpStep(addLog);
});

bench("toOpStep - MSTORE - voltaire", () => {
	StructLog.toOpStep(mstoreLog);
});

bench("toOpStep - SLOAD - voltaire", () => {
	StructLog.toOpStep(sloadLog);
});

bench("toOpStep - CALL - voltaire", () => {
	StructLog.toOpStep(callLog);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const logSequence = [pushLog, addLog, mstoreLog, sloadLog, callLog, deepLog];

bench("from - 6 different ops - voltaire", () => {
	for (const log of logSequence) {
		StructLog.from(log);
	}
});

await run();

bench("toOpStep - 6 different ops - voltaire", () => {
	for (const log of logSequence) {
		StructLog.toOpStep(log);
	}
});

await run();

// Simulate processing a trace with 100 steps
const trace100 = Array.from({ length: 100 }, (_, i) => ({
	pc: i * 2,
	op: i % 5 === 0 ? "CALL" : i % 3 === 0 ? "SLOAD" : "ADD",
	gas: BigInt(1000000 - i * 100),
	gasCost: BigInt(i % 5 === 0 ? 100 : i % 3 === 0 ? 2100 : 3),
	depth: Math.min(4, Math.floor(i / 25) + 1),
	stack: [
		"0x0000000000000000000000000000000000000000000000000000000000000001",
		"0x0000000000000000000000000000000000000000000000000000000000000002",
	],
}));

bench("from - 100 step trace - voltaire", () => {
	for (const step of trace100) {
		StructLog.from(step);
	}
});

await run();
