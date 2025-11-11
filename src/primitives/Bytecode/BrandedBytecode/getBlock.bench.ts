/**
 * getBlock() and getNextPc() Benchmarks
 *
 * Measures performance of basic block lookup and program counter navigation
 */

import { bench, run } from "mitata";
import type { BrandedBytecode } from "./BrandedBytecode.js";
import { from } from "./from.js";
import { getBlock } from "./getBlock.js";
import { _getNextPc } from "./index.js";

// ============================================================================
// Test Data Generation
// ============================================================================

function generateComplexBytecode(size: number): BrandedBytecode {
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
			// 10% JUMPDEST
			bytecode.push(0x5b);
			pos += 1;
		} else if (Math.random() < 0.05) {
			// 5% JUMP or JUMPI
			bytecode.push(Math.random() < 0.5 ? 0x56 : 0x57);
			pos += 1;
		} else {
			// Regular opcode
			bytecode.push(op % 0x60);
			pos += 1;
		}
	}

	return from(new Uint8Array(bytecode.slice(0, size)));
}

// Generate test data
const smallCode = generateComplexBytecode(100);
const mediumCode = generateComplexBytecode(1000);
const largeCode = generateComplexBytecode(10000);
const hugeCode = generateComplexBytecode(50000);

// PUSH-heavy bytecode
const push1Heavy = from(
	new Uint8Array([
		...Array(500)
			.fill(0)
			.flatMap(() => [0x60, Math.floor(Math.random() * 256)]),
	]),
);

// PUSH32-heavy bytecode
const push32Heavy = from(
	new Uint8Array([
		...Array(50)
			.fill(0)
			.flatMap(() => [
				0x7f,
				...Array(32)
					.fill(0)
					.map(() => Math.floor(Math.random() * 256)),
			]),
	]),
);

// Simple linear bytecode (no jumps)
const linearCode = from(
	new Uint8Array([
		0x60, 0x01, 0x60, 0x02, 0x01, 0x60, 0x03, 0x02, 0x60, 0x04, 0x03, 0x00,
	]),
);

// ============================================================================
// getBlock() Benchmarks
// ============================================================================

// First block lookups
bench("getBlock - first block (small)", () => {
	getBlock(smallCode, 0);
});

bench("getBlock - first block (medium)", () => {
	getBlock(mediumCode, 0);
});

bench("getBlock - first block (large)", () => {
	getBlock(largeCode, 0);
});

// Middle block lookups
bench("getBlock - middle block (small)", () => {
	getBlock(smallCode, 50);
});

bench("getBlock - middle block (medium)", () => {
	getBlock(mediumCode, 500);
});

bench("getBlock - middle block (large)", () => {
	getBlock(largeCode, 5000);
});

// Cached lookups (after first call, blocks are cached)
bench("getBlock - cached lookup x100 (small)", () => {
	for (let i = 0; i < 100; i++) {
		getBlock(smallCode, i % 50);
	}
});

bench("getBlock - cached lookup x100 (medium)", () => {
	for (let i = 0; i < 100; i++) {
		getBlock(mediumCode, (i * 10) % 1000);
	}
});

bench("getBlock - cached lookup x100 (large)", () => {
	for (let i = 0; i < 100; i++) {
		getBlock(largeCode, (i * 100) % 10000);
	}
});

// Binary search across large bytecode
bench("getBlock - binary search (huge 50kb)", () => {
	for (let pc = 0; pc < 50000; pc += 500) {
		const block = getBlock(hugeCode, pc);
		if (!block) break;
	}
});

// ============================================================================
// getNextPc() Benchmarks
// ============================================================================

// Sequential navigation through linear bytecode
bench("getNextPc - linear traversal (small)", () => {
	let pc = 0;
	let count = 0;
	while (pc !== undefined && count < 100) {
		const next = _getNextPc(smallCode, pc);
		if (next === undefined) break;
		pc = next;
		count++;
	}
});

bench("getNextPc - linear traversal (medium)", () => {
	let pc = 0;
	let count = 0;
	while (pc !== undefined && count < 1000) {
		const next = _getNextPc(mediumCode, pc);
		if (next === undefined) break;
		pc = next;
		count++;
	}
});

bench("getNextPc - linear traversal (large)", () => {
	let pc = 0;
	let count = 0;
	while (pc !== undefined && count < 10000) {
		const next = _getNextPc(largeCode, pc);
		if (next === undefined) break;
		pc = next;
		count++;
	}
});

// PUSH1-heavy bytecode navigation
bench("getNextPc - PUSH1 heavy x100", () => {
	let pc = 0;
	for (let i = 0; i < 100; i++) {
		const next = _getNextPc(push1Heavy, pc);
		if (next === undefined) break;
		pc = next;
	}
});

// PUSH32-heavy bytecode navigation (large jumps)
bench("getNextPc - PUSH32 heavy x50", () => {
	let pc = 0;
	for (let i = 0; i < 50; i++) {
		const next = _getNextPc(push32Heavy, pc);
		if (next === undefined) break;
		pc = next;
	}
});

// Simple linear bytecode
bench("getNextPc - linear bytecode traversal", () => {
	let pc = 0;
	while (pc !== undefined) {
		pc = _getNextPc(linearCode, pc);
	}
});

// Random PC lookups (no sequential guarantee)
bench("getNextPc - random PC lookups (medium)", () => {
	for (let i = 0; i < 100; i++) {
		const pc = Math.floor(Math.random() * (mediumCode.length - 1));
		_getNextPc(mediumCode, pc);
	}
});

bench("getNextPc - random PC lookups (large)", () => {
	for (let i = 0; i < 100; i++) {
		const pc = Math.floor(Math.random() * (largeCode.length - 1));
		_getNextPc(largeCode, pc);
	}
});

// ============================================================================
// Combined Workloads
// ============================================================================

// Typical control flow analysis: getBlock + navigate within block
bench("combined - block lookup + within-block navigation (medium)", () => {
	for (let blockPc = 0; blockPc < mediumCode.length; blockPc += 50) {
		const block = getBlock(mediumCode, blockPc);
		if (!block) break;

		let pc = block.startPc;
		while (pc !== undefined && pc < block.endPc) {
			pc = _getNextPc(mediumCode, pc);
		}
	}
});

bench("combined - block lookup + within-block navigation (large)", () => {
	for (let blockPc = 0; blockPc < largeCode.length; blockPc += 500) {
		const block = getBlock(largeCode, blockPc);
		if (!block) break;

		let pc = block.startPc;
		while (pc !== undefined && pc < block.endPc) {
			pc = _getNextPc(largeCode, pc);
		}
	}
});

await run();
