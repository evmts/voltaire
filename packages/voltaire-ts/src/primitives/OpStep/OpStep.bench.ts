/**
 * OpStep Benchmarks: Voltaire TS
 *
 * Compares performance of operation step operations.
 * OpStep represents a single EVM execution step (simplified StructLog).
 */

import { bench, run } from "mitata";
import * as OpStep from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Simple opcodes
const pushStep = OpStep.from({
	pc: 0,
	op: 0x60, // PUSH1
	gas: 1000000n,
	gasCost: 3n,
	depth: 1,
});

const addStep = OpStep.from({
	pc: 2,
	op: 0x01, // ADD
	gas: 999997n,
	gasCost: 3n,
	depth: 1,
});

// Storage operation
const sloadStep = OpStep.from({
	pc: 10,
	op: 0x54, // SLOAD
	gas: 999900n,
	gasCost: 2100n,
	depth: 1,
});

// Call operation
const callStep = OpStep.from({
	pc: 100,
	op: 0xf1, // CALL
	gas: 900000n,
	gasCost: 100n,
	depth: 1,
});

// Step with error
const errorStep = OpStep.from({
	pc: 200,
	op: 0xfd, // REVERT
	gas: 50000n,
	gasCost: 0n,
	depth: 1,
	error: "execution reverted",
});

// Deep nested step
const deepStep = OpStep.from({
	pc: 500,
	op: 0xf3, // RETURN
	gas: 100000n,
	gasCost: 0n,
	depth: 4,
});

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - PUSH1 - voltaire", () => {
	OpStep.from({
		pc: 0,
		op: 0x60,
		gas: 1000000n,
		gasCost: 3n,
		depth: 1,
	});
});

bench("from - ADD - voltaire", () => {
	OpStep.from({
		pc: 2,
		op: 0x01,
		gas: 999997n,
		gasCost: 3n,
		depth: 1,
	});
});

bench("from - SLOAD - voltaire", () => {
	OpStep.from({
		pc: 10,
		op: 0x54,
		gas: 999900n,
		gasCost: 2100n,
		depth: 1,
	});
});

bench("from - CALL - voltaire", () => {
	OpStep.from({
		pc: 100,
		op: 0xf1,
		gas: 900000n,
		gasCost: 100n,
		depth: 1,
	});
});

await run();

bench("from - with error - voltaire", () => {
	OpStep.from({
		pc: 200,
		op: 0xfd,
		gas: 50000n,
		gasCost: 0n,
		depth: 1,
		error: "execution reverted",
	});
});

bench("from - deep depth - voltaire", () => {
	OpStep.from({
		pc: 500,
		op: 0xf3,
		gas: 100000n,
		gasCost: 0n,
		depth: 4,
	});
});

await run();

// ============================================================================
// hasError benchmarks
// ============================================================================

bench("hasError - no error - voltaire", () => {
	OpStep.hasError(pushStep);
});

bench("hasError - has error - voltaire", () => {
	OpStep.hasError(errorStep);
});

bench("hasError - call step - voltaire", () => {
	OpStep.hasError(callStep);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const steps = [pushStep, addStep, sloadStep, callStep, errorStep, deepStep];

bench("from - 6 different steps - voltaire", () => {
	for (const step of steps) {
		OpStep.from(step);
	}
});

await run();

bench("hasError - 6 different steps - voltaire", () => {
	for (const step of steps) {
		OpStep.hasError(step);
	}
});

await run();

// Simulate processing a trace with 100 steps
const trace100 = Array.from({ length: 100 }, (_, i) => ({
	pc: i * 2,
	op: i % 5 === 0 ? 0xf1 : i % 3 === 0 ? 0x54 : 0x01, // CALL, SLOAD, ADD
	gas: BigInt(1000000 - i * 100),
	gasCost: BigInt(i % 5 === 0 ? 100 : i % 3 === 0 ? 2100 : 3),
	depth: Math.min(4, Math.floor(i / 25) + 1),
}));

bench("from - 100 step trace - voltaire", () => {
	for (const step of trace100) {
		OpStep.from(step);
	}
});

await run();
