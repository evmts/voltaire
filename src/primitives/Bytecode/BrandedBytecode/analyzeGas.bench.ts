/**
 * Benchmark: analyzeGas() performance
 *
 * Measures gas analysis performance with different bytecode sizes and options
 */

import { bench, run } from "mitata";
import type { BrandedBytecode } from "./BrandedBytecode.js";
import * as Bytecode from "./index.js";

// ============================================================================
// Test Data Generation
// ============================================================================

/**
 * Generate realistic bytecode with controlled characteristics
 */
function generateBytecode(size: number): BrandedBytecode {
	const bytecode: number[] = [];
	let pos = 0;

	while (pos < size) {
		// Mix of instructions
		const rand = Math.random();

		if (rand < 0.3 && pos + 32 < size) {
			// PUSH32 instruction (30% chance)
			bytecode.push(0x7f); // PUSH32
			for (let i = 0; i < 32; i++) {
				bytecode.push(Math.floor(Math.random() * 256));
			}
			pos += 33;
		} else if (rand < 0.5 && pos + 1 < size) {
			// PUSH1 instruction (20% chance)
			bytecode.push(0x60); // PUSH1
			bytecode.push(Math.floor(Math.random() * 256));
			pos += 2;
		} else if (rand < 0.6) {
			// JUMPDEST (10% chance)
			bytecode.push(0x5b); // JUMPDEST
			pos += 1;
		} else if (rand < 0.8) {
			// Arithmetic ops (20% chance: ADD, MUL, SUB, DIV)
			const ops = [0x01, 0x02, 0x03, 0x04];
			bytecode.push(ops[Math.floor(Math.random() * ops.length)]);
			pos += 1;
		} else {
			// Other opcodes (10% chance)
			bytecode.push(Math.floor(Math.random() * 256));
			pos += 1;
		}
	}

	return new Uint8Array(bytecode.slice(0, size)) as BrandedBytecode;
}

/**
 * Generate bytecode with control flow (branches)
 */
function generateBranchingBytecode(size: number): BrandedBytecode {
	const bytecode: number[] = [];

	for (let i = 0; i < size / 10; i++) {
		// PUSH1 <addr> JUMP
		bytecode.push(0x60, Math.floor(Math.random() * 256)); // PUSH1
		bytecode.push(0x56); // JUMP

		// JUMPDEST PUSH1 <op> JUMPI
		bytecode.push(0x5b); // JUMPDEST
		bytecode.push(0x60, Math.floor(Math.random() * 256)); // PUSH1
		bytecode.push(0x57); // JUMPI

		// Some operations
		const ops = [0x01, 0x02, 0x03, 0x04, 0x08, 0x09];
		for (let j = 0; j < 5; j++) {
			bytecode.push(ops[Math.floor(Math.random() * ops.length)]);
		}
	}

	return new Uint8Array(bytecode.slice(0, size)) as BrandedBytecode;
}

/**
 * Generate bytecode with expensive operations
 */
function generateExpensiveBytecode(size: number): BrandedBytecode {
	const bytecode: number[] = [];
	let pos = 0;

	while (pos < size) {
		const rand = Math.random();

		if (rand < 0.2 && pos + 10 < size) {
			// SSTORE (expensive, 20% chance)
			bytecode.push(0x60, 0x00); // PUSH1 0x00
			bytecode.push(0x60, Math.floor(Math.random() * 256)); // PUSH1
			bytecode.push(0x55); // SSTORE
			pos += 5;
		} else if (rand < 0.25 && pos + 10 < size) {
			// CREATE (very expensive, 5% chance)
			bytecode.push(0x60, 0x00); // PUSH1 0x00
			bytecode.push(0x60, 0x00); // PUSH1 0x00
			bytecode.push(0x60, 0x00); // PUSH1 0x00
			bytecode.push(0xf0); // CREATE
			pos += 7;
		} else if (rand < 0.35 && pos + 10 < size) {
			// KECCAK256 (medium cost, 10% chance)
			bytecode.push(0x60, 0x00); // PUSH1 0x00
			bytecode.push(0x60, 0x00); // PUSH1 0x00
			bytecode.push(0x20); // KECCAK256
			pos += 5;
		} else {
			// Regular opcodes
			const ops = [0x01, 0x02, 0x03, 0x04, 0x50, 0x51]; // ADD, MUL, SUB, DIV, MLOAD, MSTORE
			bytecode.push(ops[Math.floor(Math.random() * ops.length)]);
			pos += 1;
		}
	}

	return new Uint8Array(bytecode.slice(0, size)) as BrandedBytecode;
}

// ============================================================================
// Benchmark Test Data
// ============================================================================

// Simple bytecode patterns
const simpleBytecode = new Uint8Array([
	0x60, 0x01, 0x60, 0x02, 0x01, // PUSH1 1, PUSH1 2, ADD
]) as BrandedBytecode;

const erc20Pattern = new Uint8Array([
	0x60, 0x00, // PUSH1 0
	0x60, 0x01, // PUSH1 1
	0x54, // SLOAD
	0x60, 0x02, // PUSH1 2
	0x81, // DUP2
	0x10, // LT
	0x15, // ISZERO
	0x60, 0x0e, // PUSH1 14
	0x57, // JUMPI
	0x5b, // JUMPDEST
]) as BrandedBytecode;

// Sized bytecode samples
const small = generateBytecode(100);
const medium = generateBytecode(1000);
const large = generateBytecode(10000);
const huge = generateBytecode(50000);

// Branching bytecode samples
const smallBranching = generateBranchingBytecode(100);
const mediumBranching = generateBranchingBytecode(1000);
const largeBranching = generateBranchingBytecode(10000);

// Expensive bytecode samples
const smallExpensive = generateExpensiveBytecode(100);
const mediumExpensive = generateExpensiveBytecode(1000);
const largeExpensive = generateExpensiveBytecode(10000);

// ============================================================================
// Benchmarks: Basic Analysis
// ============================================================================

bench("analyzeGas() - simple bytecode", () => {
	Bytecode.analyzeGas(simpleBytecode);
});

bench("analyzeGas() - ERC20 pattern", () => {
	Bytecode.analyzeGas(erc20Pattern);
});

await run();

// ============================================================================
// Benchmarks: Size Scaling (basic analysis)
// ============================================================================

bench("analyzeGas() - small (100 bytes)", () => {
	Bytecode.analyzeGas(small);
});

bench("analyzeGas() - medium (1 KB)", () => {
	Bytecode.analyzeGas(medium);
});

bench("analyzeGas() - large (10 KB)", () => {
	Bytecode.analyzeGas(large);
});

bench("analyzeGas() - huge (50 KB)", () => {
	Bytecode.analyzeGas(huge);
});

await run();

// ============================================================================
// Benchmarks: Path Analysis
// ============================================================================

bench("analyzeGas() with path analysis - small", () => {
	Bytecode.analyzeGas(small, { analyzePaths: true });
});

bench("analyzeGas() with path analysis - medium", () => {
	Bytecode.analyzeGas(medium, { analyzePaths: true });
});

bench("analyzeGas() with path analysis - large", () => {
	Bytecode.analyzeGas(large, { analyzePaths: true });
});

await run();

// ============================================================================
// Benchmarks: Path Analysis with Max Paths Constraint
// ============================================================================

bench("analyzeGas() with path analysis (maxPaths=10) - medium", () => {
	Bytecode.analyzeGas(medium, { analyzePaths: true, maxPaths: 10 });
});

bench("analyzeGas() with path analysis (maxPaths=100) - medium", () => {
	Bytecode.analyzeGas(medium, { analyzePaths: true, maxPaths: 100 });
});

bench("analyzeGas() with path analysis (maxPaths=1000) - medium", () => {
	Bytecode.analyzeGas(medium, { analyzePaths: true, maxPaths: 1000 });
});

await run();

// ============================================================================
// Benchmarks: Dynamic Costs
// ============================================================================

bench("analyzeGas() with dynamic costs - small", () => {
	Bytecode.analyzeGas(small, { includeDynamic: true });
});

bench("analyzeGas() with dynamic costs - medium", () => {
	Bytecode.analyzeGas(medium, { includeDynamic: true });
});

bench("analyzeGas() with dynamic costs - large", () => {
	Bytecode.analyzeGas(large, { includeDynamic: true });
});

await run();

// ============================================================================
// Benchmarks: Dynamic Costs with Warm Slots Context
// ============================================================================

const warmSlotsContext = {
	warmSlots: new Set([0n, 1n, 2n, 3n, 4n]),
};

bench("analyzeGas() dynamic with warm slots (5) - medium", () => {
	Bytecode.analyzeGas(medium, {
		includeDynamic: true,
		context: warmSlotsContext,
	});
});

await run();

// ============================================================================
// Benchmarks: Complex Bytecode Patterns
// ============================================================================

bench("analyzeGas() - branching bytecode (small)", () => {
	Bytecode.analyzeGas(smallBranching);
});

bench("analyzeGas() - branching bytecode (medium)", () => {
	Bytecode.analyzeGas(mediumBranching);
});

bench("analyzeGas() - branching bytecode (large)", () => {
	Bytecode.analyzeGas(largeBranching);
});

await run();

// ============================================================================
// Benchmarks: Expensive Operations
// ============================================================================

bench("analyzeGas() - expensive ops (small)", () => {
	Bytecode.analyzeGas(smallExpensive);
});

bench("analyzeGas() - expensive ops (medium)", () => {
	Bytecode.analyzeGas(mediumExpensive);
});

bench("analyzeGas() - expensive ops (large)", () => {
	Bytecode.analyzeGas(largeExpensive);
});

await run();

// ============================================================================
// Benchmarks: Combined Options
// ============================================================================

bench("analyzeGas() - all options (small)", () => {
	Bytecode.analyzeGas(small, {
		analyzePaths: true,
		maxPaths: 100,
		includeDynamic: true,
		context: warmSlotsContext,
	});
});

bench("analyzeGas() - all options (medium)", () => {
	Bytecode.analyzeGas(medium, {
		analyzePaths: true,
		maxPaths: 100,
		includeDynamic: true,
		context: warmSlotsContext,
	});
});

await run();
