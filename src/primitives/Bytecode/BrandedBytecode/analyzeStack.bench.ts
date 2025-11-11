/**
 * analyzeStack() Benchmarks
 *
 * Measures performance of stack analysis for various bytecode patterns and sizes
 */

import { bench, run } from "mitata";
import * as Bytecode from "./index.js";

// ============================================================================
// Test Data Generation
// ============================================================================

function generateBytecode(size: number): Uint8Array {
	const bytecode: number[] = [];
	let pos = 0;

	while (pos < size) {
		const op = Math.floor(Math.random() * 256);

		if (op >= 0x60 && op <= 0x7f) {
			// PUSH instruction
			const pushSize = op - 0x5f;
			bytecode.push(op);
			for (let i = 0; i < pushSize && pos + 1 + i < size; i++) {
				bytecode.push(Math.floor(Math.random() * 256));
			}
			pos += 1 + pushSize;
		} else if (Math.random() < 0.1) {
			// 10% chance of JUMPDEST
			bytecode.push(0x5b);
			pos += 1;
		} else {
			// Regular opcode
			bytecode.push(op % 0x60); // Avoid PUSH range
			pos += 1;
		}
	}

	return new Uint8Array(bytecode.slice(0, size));
}

// ============================================================================
// Test Cases
// ============================================================================

// Simple patterns
const emptyBytecode = Bytecode.from(new Uint8Array([]));

// PUSH1 0x01 PUSH1 0x02 ADD
const simplePush = Bytecode.from(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]));

// PUSH1 PUSH1 PUSH1 PUSH1 PUSH1 (5 items on stack)
const multiPush = Bytecode.from(
	new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x60, 0x03, 0x60, 0x04, 0x60, 0x05]),
);

// PUSH1 2 PUSH1 0 JUMPI PUSH1 1 JUMPDEST
const withJumpi = Bytecode.from(
	new Uint8Array([
		0x60, 0x07, // PUSH1 7 (jump target)
		0x60, 0x00, // PUSH1 0 (condition)
		0x57, // JUMPI
		0x60, 0x01, // PUSH1 1
		0x5b, // JUMPDEST
	]),
);

// POP (requires 1 item - underflow)
const underflowCase = Bytecode.from(new Uint8Array([0x50]));

// Create bytecode that pushes 1025 items (exceeds max depth of 1024)
const overflowCase = (() => {
	const ops: number[] = [];
	for (let i = 0; i < 1025; i++) {
		ops.push(0x60, 0x00); // PUSH1 0x00
	}
	return Bytecode.from(new Uint8Array(ops));
})();

// Random bytecode of various sizes
const smallCode = Bytecode.from(generateBytecode(100));
const mediumCode = Bytecode.from(generateBytecode(1000));
const largeCode = Bytecode.from(generateBytecode(10000));
const hugeCode = Bytecode.from(generateBytecode(50000));

// ============================================================================
// Benchmarks - Basic Operations
// ============================================================================

bench("analyzeStack() - empty bytecode", () => {
	Bytecode.analyzeStack(emptyBytecode);
});

bench("analyzeStack() - simple (PUSH + ADD)", () => {
	Bytecode.analyzeStack(simplePush);
});

bench("analyzeStack() - multiple pushes", () => {
	Bytecode.analyzeStack(multiPush);
});

bench("analyzeStack() - with JUMPI", () => {
	Bytecode.analyzeStack(withJumpi);
});

// ============================================================================
// Benchmarks - Error Detection
// ============================================================================

bench("analyzeStack() - underflow detection", () => {
	Bytecode.analyzeStack(underflowCase);
});

bench("analyzeStack() - overflow detection", () => {
	Bytecode.analyzeStack(overflowCase);
});

bench("analyzeStack() - underflow with failFast", () => {
	Bytecode.analyzeStack(underflowCase, { failFast: true });
});

bench("analyzeStack() - underflow collecting all errors", () => {
	Bytecode.analyzeStack(underflowCase, { failFast: false });
});

// ============================================================================
// Benchmarks - Size Scaling
// ============================================================================

bench("analyzeStack() - small (100b)", () => {
	Bytecode.analyzeStack(smallCode);
});

bench("analyzeStack() - medium (1kb)", () => {
	Bytecode.analyzeStack(mediumCode);
});

bench("analyzeStack() - large (10kb)", () => {
	Bytecode.analyzeStack(largeCode);
});

bench("analyzeStack() - huge (50kb)", () => {
	Bytecode.analyzeStack(hugeCode);
});

// ============================================================================
// Benchmarks - Path Analysis Options
// ============================================================================

bench("analyzeStack() with analyzePaths disabled", () => {
	Bytecode.analyzeStack(withJumpi, { analyzePaths: false });
});

bench("analyzeStack() with analyzePaths enabled", () => {
	Bytecode.analyzeStack(withJumpi, { analyzePaths: true });
});

bench("analyzeStack() with analyzePaths enabled - medium code", () => {
	Bytecode.analyzeStack(mediumCode, { analyzePaths: true, maxPaths: 100 });
});

bench("analyzeStack() with analyzePaths enabled - large code", () => {
	Bytecode.analyzeStack(largeCode, { analyzePaths: true, maxPaths: 100 });
});

// ============================================================================
// Benchmarks - Custom Options
// ============================================================================

bench("analyzeStack() - custom maxDepth (512)", () => {
	Bytecode.analyzeStack(mediumCode, { maxDepth: 512 });
});

bench("analyzeStack() - custom initialDepth (5)", () => {
	Bytecode.analyzeStack(multiPush, { initialDepth: 5 });
});

bench("analyzeStack() - custom maxPaths (50)", () => {
	Bytecode.analyzeStack(largeCode, { analyzePaths: true, maxPaths: 50 });
});

bench("analyzeStack() - multiple custom options", () => {
	Bytecode.analyzeStack(largeCode, {
		initialDepth: 2,
		maxDepth: 512,
		analyzePaths: true,
		maxPaths: 100,
		failFast: false,
	});
});

// ============================================================================
// Benchmarks - failFast Comparison
// ============================================================================

bench("analyzeStack() - failFast enabled on valid code", () => {
	Bytecode.analyzeStack(mediumCode, { failFast: true });
});

bench("analyzeStack() - failFast disabled on valid code", () => {
	Bytecode.analyzeStack(mediumCode, { failFast: false });
});

bench("analyzeStack() - failFast enabled on large code", () => {
	Bytecode.analyzeStack(largeCode, { failFast: true });
});

bench("analyzeStack() - failFast disabled on large code", () => {
	Bytecode.analyzeStack(largeCode, { failFast: false });
});

// ============================================================================
// Run Benchmarks
// ============================================================================

await run();
