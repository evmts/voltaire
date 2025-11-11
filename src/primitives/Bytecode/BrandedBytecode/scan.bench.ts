/**
 * Benchmark: Bytecode.scan() - TypeScript vs WASM implementation
 * Compares performance of bytecode instruction scanning
 */

import { bench, run } from "mitata";
import { loadWasm } from "../../../wasm-loader/loader.js";
import * as Bytecode from "./index.js";
import * as BytecodeWasm from "../Bytecode.wasm.js";

// Load WASM before running benchmarks
await loadWasm(new URL("../../../wasm-loader/primitives.wasm", import.meta.url));

// ============================================================================
// Test Bytecode: Real contract patterns
// ============================================================================

// ERC20 transfer function (common pattern)
const erc20Transfer = new Uint8Array([
	0x60, 0x60, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15, 0x61, 0x00, 0xdc, 0x57, 0x60, 0x00, 0x35, 0x90,
	0x73, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0xff, 0xff, 0xff, 0xff, 0x16, 0x14, 0x61, 0x00, 0x38, 0x57, 0x60, 0x00, 0x80, 0xfd, 0x5b,
	0x60, 0x04, 0x36, 0x10, 0x61, 0x00, 0xb9, 0x57, 0x60, 0xe0, 0x35, 0x10, 0x61, 0x00, 0xb9, 0x57,
	0x60, 0x00, 0x35, 0x60, 0xff, 0x16, 0x61, 0x00, 0x5f, 0x57, 0x60, 0x01, 0x90, 0x04, 0x61, 0x00,
	0xb9, 0x57, 0x5b, 0x60, 0x00, 0x60, 0x20, 0x81, 0x60, 0x04, 0x90, 0x03, 0x90, 0x80, 0x80, 0x35,
	0x15, 0x61, 0x00, 0x80, 0x57, 0x60, 0x00, 0x80, 0xfd, 0x5b, 0x60, 0x24, 0x81, 0x60, 0x04, 0x90,
	0x03, 0x90, 0x80, 0x35, 0x15, 0x61, 0x00, 0x90, 0x57, 0x60, 0x00, 0x80, 0xfd, 0x5b, 0x90, 0x90,
	0x92, 0x50, 0x60, 0x40, 0x51, 0x90, 0x92, 0x91, 0x82, 0x52, 0x3d, 0x91, 0x82, 0x11, 0x61, 0x00,
	0xb0, 0x57, 0x81, 0x81, 0x60, 0x20, 0x01, 0x80, 0x82, 0x01, 0x90, 0x80, 0x92, 0x50, 0x50, 0x51,
	0x92, 0x50, 0x90, 0x92, 0x51, 0x90, 0x92, 0x50, 0x90, 0xf3, 0x5b, 0x80, 0xfd, 0x5b, 0x00,
]) as any;

// Simple bytecode: few instructions
const simpleCode = new Uint8Array([
	0x60, 0x01, // PUSH1 0x01
	0x60, 0x02, // PUSH1 0x02
	0x01, // ADD
	0x60, 0x03, // PUSH1 0x03
	0x02, // MUL
	0x00, // STOP
]) as any;

// Medium bytecode: ~500 bytes with varied instructions
const mediumCode = new Uint8Array([
	0x60, 0x80, 0x60, 0x40, 0x52, // PUSH1 0x80, PUSH1 0x40, MSTORE
	0x34, 0x80, 0x15, 0x61, 0x00, 0xdc, 0x57, // CALLVALUE, DUP1, ISZERO, PUSH2 0x00dc, JUMPI
	0x60, 0x00, 0x80, 0xfd, 0x5b, // PUSH1 0x00, DUP1, REVERT, JUMPDEST
	0x60, 0x04, 0x36, 0x10, 0x61, 0x00, 0xb9, 0x57, // PUSH1 0x04, CALLDATASIZE, LT, PUSH2 0x00b9, JUMPI
	0x60, 0xe0, 0x35, 0x10, 0x61, 0x00, 0xb9, 0x57, // PUSH1 0xe0, CALLDATALOAD, LT, PUSH2 0x00b9, JUMPI
	...Array(400).fill(0x00), // Padding with STOPs
]) as any;

// Large bytecode: ~2KB (realistic contract)
const largeCode = new Uint8Array([
	...erc20Transfer,
	...Array(1800).fill(0x00), // Padding
]) as any;

// Bytecode with many PUSH instructions
const pushHeavy = (() => {
	const bytes: number[] = [];
	for (let i = 0; i < 100; i++) {
		bytes.push(0x60, i & 0xff); // PUSH1 repeated
	}
	return new Uint8Array(bytes) as any;
})();

// ============================================================================
// Benchmarks: Basic scan
// ============================================================================

bench("scan() simple - TypeScript", () => {
	for (const inst of Bytecode.scan(simpleCode)) {
		// Consume iterator
	}
});

bench("scan() simple - WASM", () => {
	for (const inst of BytecodeWasm.scan(simpleCode)) {
		// Consume iterator
	}
});

await run();

// ============================================================================
// Benchmarks: Medium-sized bytecode
// ============================================================================

bench("scan() medium (500b) - TypeScript", () => {
	for (const inst of Bytecode.scan(mediumCode)) {
		// Consume iterator
	}
});

bench("scan() medium (500b) - WASM", () => {
	for (const inst of BytecodeWasm.scan(mediumCode)) {
		// Consume iterator
	}
});

await run();

// ============================================================================
// Benchmarks: Large bytecode (realistic contracts)
// ============================================================================

bench("scan() large (2KB) - TypeScript", () => {
	for (const inst of Bytecode.scan(largeCode)) {
		// Consume iterator
	}
});

bench("scan() large (2KB) - WASM", () => {
	for (const inst of BytecodeWasm.scan(largeCode)) {
		// Consume iterator
	}
});

await run();

// ============================================================================
// Benchmarks: PUSH-heavy bytecode
// ============================================================================

bench("scan() push-heavy - TypeScript", () => {
	for (const inst of Bytecode.scan(pushHeavy)) {
		// Consume iterator
	}
});

bench("scan() push-heavy - WASM", () => {
	for (const inst of BytecodeWasm.scan(pushHeavy)) {
		// Consume iterator
	}
});

await run();

// ============================================================================
// Benchmarks: With options (gas costs)
// ============================================================================

bench("scan() with gas - TypeScript", () => {
	for (const inst of Bytecode.scan(mediumCode, { withGas: true })) {
		// Consume iterator
	}
});

bench("scan() with gas - WASM", () => {
	for (const inst of BytecodeWasm.scan(mediumCode, { withGas: true })) {
		// Consume iterator
	}
});

await run();

// ============================================================================
// Benchmarks: With options (stack effects)
// ============================================================================

bench("scan() with stack - TypeScript", () => {
	for (const inst of Bytecode.scan(mediumCode, { withStack: true })) {
		// Consume iterator
	}
});

bench("scan() with stack - WASM", () => {
	for (const inst of BytecodeWasm.scan(mediumCode, { withStack: true })) {
		// Consume iterator
	}
});

await run();

// ============================================================================
// Benchmarks: With range options
// ============================================================================

bench("scan() with range - TypeScript", () => {
	for (const inst of Bytecode.scan(mediumCode, { startPc: 10, endPc: 400 })) {
		// Consume iterator
	}
});

bench("scan() with range - WASM", () => {
	for (const inst of BytecodeWasm.scan(mediumCode, { startPc: 10, endPc: 400 })) {
		// Consume iterator
	}
});

await run();

// ============================================================================
// Benchmarks: All options combined
// ============================================================================

bench("scan() all options - TypeScript", () => {
	for (const inst of Bytecode.scan(mediumCode, {
		withGas: true,
		withStack: true,
		startPc: 0,
		endPc: 300,
	})) {
		// Consume iterator
	}
});

bench("scan() all options - WASM", () => {
	for (const inst of BytecodeWasm.scan(mediumCode, {
		withGas: true,
		withStack: true,
		startPc: 0,
		endPc: 300,
	})) {
		// Consume iterator
	}
});

await run();
