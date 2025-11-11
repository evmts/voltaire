/**
 * Benchmark: detectFusions() - TypeScript vs WASM
 *
 * Compares performance of fusion detection in bytecode across implementations.
 * Tests both fusion-heavy bytecode (many optimization opportunities) and
 * real contract patterns.
 */

import { bench, run } from "mitata";
import { loadWasm } from "../../../wasm-loader/loader.js";
import * as BytecodeWasm from "../Bytecode.wasm.js";
import * as Bytecode from "./index.js";

// Load WASM before running benchmarks
await loadWasm(
	new URL("../../../wasm-loader/primitives.wasm", import.meta.url),
);

// ============================================================================
// Test Data Generation
// ============================================================================

/**
 * Generate bytecode with many fusion opportunities
 * Creates patterns like: PUSH+ADD, PUSH+MUL, DUP+SWAP, SWAP+POP
 */
function generateFusionHeavyBytecode(size: number): Uint8Array {
	const bytecode: number[] = [];
	let pos = 0;

	while (pos < size) {
		// Bias heavily toward fusion patterns
		const rand = Math.random();

		if (rand < 0.3) {
			// PUSH + arithmetic (30% chance)
			const pushSize = Math.floor(Math.random() * 3) + 1; // PUSH1-3
			const pushOp = 0x5f + pushSize;
			bytecode.push(pushOp);
			for (let i = 0; i < pushSize; i++) {
				bytecode.push(Math.floor(Math.random() * 256));
			}
			// Arithmetic op (ADD, MUL, SUB, DIV)
			const arithOps = [0x01, 0x02, 0x03, 0x04];
			bytecode.push(arithOps[Math.floor(Math.random() * arithOps.length)]);
			pos += pushSize + 2;
		} else if (rand < 0.5) {
			// DUP + SWAP with matching depths (20% chance)
			const depth = Math.floor(Math.random() * 16) + 1; // 1-16
			bytecode.push(0x7f + depth); // DUP1-DUP16
			bytecode.push(0x8f + depth); // SWAP1-SWAP16
			pos += 2;
		} else if (rand < 0.65) {
			// SWAP + POP (15% chance)
			const depth = Math.floor(Math.random() * 16) + 1; // 1-16
			bytecode.push(0x8f + depth); // SWAP1-SWAP16
			bytecode.push(0x50); // POP
			pos += 2;
		} else if (rand < 0.8) {
			// PUSH + JUMP/JUMPI (15% chance)
			const pushSize = Math.floor(Math.random() * 3) + 1; // PUSH1-3
			const pushOp = 0x5f + pushSize;
			bytecode.push(pushOp);
			for (let i = 0; i < pushSize; i++) {
				bytecode.push(Math.floor(Math.random() * 256));
			}
			const jumpOps = [0x56, 0x57]; // JUMP, JUMPI
			bytecode.push(jumpOps[Math.floor(Math.random() * jumpOps.length)]);
			pos += pushSize + 2;
		} else if (rand < 0.9) {
			// PUSH + DUP/SWAP (10% chance)
			const pushSize = Math.floor(Math.random() * 3) + 1; // PUSH1-3
			const pushOp = 0x5f + pushSize;
			bytecode.push(pushOp);
			for (let i = 0; i < pushSize; i++) {
				bytecode.push(Math.floor(Math.random() * 256));
			}
			const depth = Math.floor(Math.random() * 16) + 1; // 1-16
			if (Math.random() < 0.5) {
				bytecode.push(0x7f + depth); // DUP
			} else {
				bytecode.push(0x8f + depth); // SWAP
			}
			pos += pushSize + 2;
		} else {
			// Single opcode (10% chance)
			bytecode.push(Math.floor(Math.random() * 0x5b)); // Random non-PUSH
			pos++;
		}
	}

	return new Uint8Array(bytecode.slice(0, size));
}

/**
 * Generate realistic contract-like bytecode
 * More sparse fusion patterns, realistic opcode distribution
 */
function generateRealisticBytecode(size: number): Uint8Array {
	const bytecode: number[] = [];
	let pos = 0;

	while (pos < size) {
		const rand = Math.random();

		if (rand < 0.15) {
			// PUSH instructions (~15%)
			const pushSize = Math.floor(Math.random() * 32) + 1; // PUSH1-32
			const pushOp = 0x5f + pushSize;
			bytecode.push(pushOp);
			for (let i = 0; i < pushSize && pos + 1 + i < size; i++) {
				bytecode.push(Math.floor(Math.random() * 256));
			}
			pos += 1 + pushSize;
		} else if (rand < 0.2) {
			// DUP/SWAP instructions (~5%)
			const op = Math.random() < 0.5 ? 0x80 : 0x90;
			const depth = Math.floor(Math.random() * 16);
			bytecode.push(op + depth);
			pos++;
		} else if (rand < 0.25) {
			// Arithmetic ops (~5%)
			const ops = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a];
			bytecode.push(ops[Math.floor(Math.random() * ops.length)]);
			pos++;
		} else if (rand < 0.3) {
			// Control flow (~5%)
			const ops = [0x56, 0x57, 0x5b]; // JUMP, JUMPI, JUMPDEST
			bytecode.push(ops[Math.floor(Math.random() * ops.length)]);
			pos++;
		} else {
			// Other opcodes (~70%)
			bytecode.push(Math.floor(Math.random() * 256));
			pos++;
		}
	}

	return new Uint8Array(bytecode.slice(0, size));
}

// Generate test datasets
const fusionHeavySmall = generateFusionHeavyBytecode(500);
const fusionHeavyMedium = generateFusionHeavyBytecode(5000);
const fusionHeavyLarge = generateFusionHeavyBytecode(50000);

const realisticSmall = generateRealisticBytecode(500);
const realisticMedium = generateRealisticBytecode(5000);
const realisticLarge = generateRealisticBytecode(50000);

// Specific test patterns from detectFusions.test.ts
const pushAddPattern = new Uint8Array([0x60, 0x05, 0x01]); // PUSH1 0x05, ADD
const pushJumpPattern = new Uint8Array([0x60, 0x10, 0x56]); // PUSH1 0x10, JUMP
const dupSwapPattern = new Uint8Array([0x80, 0x90]); // DUP1, SWAP1
const swapPopPattern = new Uint8Array([0x90, 0x50]); // SWAP1, POP

// Multiple fusions pattern
const multiplePattern = new Uint8Array([
	0x60,
	0x05,
	0x01, // PUSH1 0x05, ADD
	0x60,
	0x10,
	0x56, // PUSH1 0x10, JUMP
]);

// ============================================================================
// Benchmarks
// ============================================================================

// Fusion-heavy bytecode
bench("detectFusions() - TypeScript - fusion-heavy (500b)", () => {
	const code = Bytecode.from(fusionHeavySmall);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - fusion-heavy (500b)", () => {
	const code = BytecodeWasm.from(fusionHeavySmall);
	BytecodeWasm.detectFusions(code);
});

await run();

bench("detectFusions() - TypeScript - fusion-heavy (5kb)", () => {
	const code = Bytecode.from(fusionHeavyMedium);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - fusion-heavy (5kb)", () => {
	const code = BytecodeWasm.from(fusionHeavyMedium);
	BytecodeWasm.detectFusions(code);
});

await run();

bench("detectFusions() - TypeScript - fusion-heavy (50kb)", () => {
	const code = Bytecode.from(fusionHeavyLarge);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - fusion-heavy (50kb)", () => {
	const code = BytecodeWasm.from(fusionHeavyLarge);
	BytecodeWasm.detectFusions(code);
});

await run();

// Realistic contract bytecode
bench("detectFusions() - TypeScript - realistic (500b)", () => {
	const code = Bytecode.from(realisticSmall);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - realistic (500b)", () => {
	const code = BytecodeWasm.from(realisticSmall);
	BytecodeWasm.detectFusions(code);
});

await run();

bench("detectFusions() - TypeScript - realistic (5kb)", () => {
	const code = Bytecode.from(realisticMedium);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - realistic (5kb)", () => {
	const code = BytecodeWasm.from(realisticMedium);
	BytecodeWasm.detectFusions(code);
});

await run();

bench("detectFusions() - TypeScript - realistic (50kb)", () => {
	const code = Bytecode.from(realisticLarge);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - realistic (50kb)", () => {
	const code = BytecodeWasm.from(realisticLarge);
	BytecodeWasm.detectFusions(code);
});

await run();

// Specific patterns
bench("detectFusions() - TypeScript - PUSH+ADD pattern", () => {
	const code = Bytecode.from(pushAddPattern);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - PUSH+ADD pattern", () => {
	const code = BytecodeWasm.from(pushAddPattern);
	BytecodeWasm.detectFusions(code);
});

await run();

bench("detectFusions() - TypeScript - PUSH+JUMP pattern", () => {
	const code = Bytecode.from(pushJumpPattern);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - PUSH+JUMP pattern", () => {
	const code = BytecodeWasm.from(pushJumpPattern);
	BytecodeWasm.detectFusions(code);
});

await run();

bench("detectFusions() - TypeScript - DUP+SWAP pattern", () => {
	const code = Bytecode.from(dupSwapPattern);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - DUP+SWAP pattern", () => {
	const code = BytecodeWasm.from(dupSwapPattern);
	BytecodeWasm.detectFusions(code);
});

await run();

bench("detectFusions() - TypeScript - SWAP+POP pattern", () => {
	const code = Bytecode.from(swapPopPattern);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - SWAP+POP pattern", () => {
	const code = BytecodeWasm.from(swapPopPattern);
	BytecodeWasm.detectFusions(code);
});

await run();

bench("detectFusions() - TypeScript - multiple patterns", () => {
	const code = Bytecode.from(multiplePattern);
	Bytecode.detectFusions(code);
});

bench("detectFusions() - WASM - multiple patterns", () => {
	const code = BytecodeWasm.from(multiplePattern);
	BytecodeWasm.detectFusions(code);
});

await run();
