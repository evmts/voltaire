/**
 * Benchmark: TypeScript vs WASM Bytecode implementations
 * Compares performance of bytecode analysis operations across backends
 */

import { bench, run } from "mitata";
import { loadWasm } from "../../wasm-loader/loader.js";
import * as BytecodeWasm from "./Bytecode.wasm.js";
import type { BrandedBytecode } from "./BytecodeType.js";
import * as BytecodeTS from "./index.js";

// Initialize WASM before benchmarks
await loadWasm(new URL("../../wasm-loader/primitives.wasm", import.meta.url));

// Helper to create branded bytecode
const bc = (arr: Uint8Array): BrandedBytecode => arr as BrandedBytecode;

// ============================================================================
// Test Data - Realistic EVM Bytecode
// ============================================================================

// Simple contract: PUSH1 0x00, PUSH1 0x00, RETURN
const simpleCode = bc(new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xf3]));

// Contract with jumps: PUSH1 0x05, JUMP, STOP, STOP, JUMPDEST, STOP
const jumpCode = bc(new Uint8Array([0x60, 0x05, 0x56, 0x00, 0x00, 0x5b, 0x00]));

// Function dispatcher pattern
const dispatcherCode = bc(
	new Uint8Array([
		0x60,
		0x04,
		0x35, // PUSH1 4, CALLDATALOAD (selector)
		0x63,
		0x12,
		0x34,
		0x56,
		0x78, // PUSH4 selector
		0x14, // EQ
		0x60,
		0x10, // PUSH1 0x10
		0x57, // JUMPI
		0x60,
		0x00,
		0x80,
		0xfd, // revert
		0x5b, // JUMPDEST
		0x60,
		0x01, // PUSH1 0x01
		0x00, // STOP
	]),
);

// Medium-sized realistic contract bytecode (simplified ERC20-like)
const mediumCode = bc(
	new Uint8Array([
		// Init code
		0x60,
		0x80,
		0x60,
		0x40,
		0x52, // PUSH1 0x80, PUSH1 0x40, MSTORE
		// Selector check
		0x60,
		0x04,
		0x36,
		0x10, // PUSH1 4, CALLDATASIZE, LT
		0x60,
		0x50,
		0x57, // PUSH1 0x50, JUMPI
		// Load selector
		0x60,
		0x00,
		0x35, // PUSH1 0, CALLDATALOAD
		0x60,
		0xe0,
		0x1c, // PUSH1 0xe0, SHR (get selector)
		// Check selectors
		0x80,
		0x63,
		0xa9,
		0x05,
		0x9c,
		0xbb, // DUP1, PUSH4 balanceOf
		0x14,
		0x60,
		0x60,
		0x57, // EQ, PUSH1 0x60, JUMPI
		0x80,
		0x63,
		0xdd,
		0x62,
		0xed,
		0x3e, // DUP1, PUSH4 transfer
		0x14,
		0x60,
		0x80,
		0x57, // EQ, PUSH1 0x80, JUMPI
		0x5b,
		0x60,
		0x00,
		0x80,
		0xfd, // JUMPDEST, revert
		// balanceOf
		0x5b, // JUMPDEST
		0x60,
		0x04,
		0x35, // PUSH1 4, CALLDATALOAD
		0x60,
		0x00,
		0x52, // PUSH1 0, MSTORE
		0x60,
		0x20,
		0x60,
		0x00,
		0x20, // PUSH1 32, PUSH1 0, SHA3
		0x54, // SLOAD
		0x60,
		0x00,
		0x52, // PUSH1 0, MSTORE
		0x60,
		0x20,
		0x60,
		0x00,
		0xf3, // PUSH1 32, PUSH1 0, RETURN
		// transfer
		0x5b, // JUMPDEST
		0x60,
		0x04,
		0x35, // PUSH1 4, CALLDATALOAD
		0x60,
		0x24,
		0x35, // PUSH1 36, CALLDATALOAD
		0x33, // CALLER
		0x60,
		0x00,
		0x52, // PUSH1 0, MSTORE
		0x60,
		0x20,
		0x60,
		0x00,
		0x20, // PUSH1 32, PUSH1 0, SHA3
		0x80,
		0x54, // DUP1, SLOAD
		0x82,
		0x81,
		0x10,
		0x15, // DUP3, DUP2, LT, ISZERO
		0x60,
		0xc0,
		0x57, // PUSH1 0xc0, JUMPI
		0x60,
		0x00,
		0x80,
		0xfd, // revert
		0x5b, // JUMPDEST
		0x82,
		0x03,
		0x81,
		0x55, // DUP3, SUB, DUP2, SSTORE
		0x50, // POP
		0x60,
		0x01,
		0x60,
		0x00,
		0x52, // PUSH1 1, PUSH1 0, MSTORE
		0x60,
		0x20,
		0x60,
		0x00,
		0xf3, // PUSH1 32, PUSH1 0, RETURN
	]),
);

// Large bytecode (many JUMPDESTs and PUSH operations)
function generateLargeBytecode(size: number): BrandedBytecode {
	const bytecode: number[] = [];
	let pos = 0;

	while (pos < size) {
		const op = Math.floor(Math.random() * 256);

		// Bias toward PUSH instructions and JUMPDESTs
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

	return bc(new Uint8Array(bytecode.slice(0, size)));
}

const largeCode = generateLargeBytecode(10000);

// Hex strings for fromHex benchmarks
const simpleHex = "0x60006000f3";
const mediumHex = BytecodeTS.toHex(mediumCode);
const largeHex = BytecodeTS.toHex(largeCode);

// ============================================================================
// from / fromHex benchmarks
// ============================================================================

bench("from(hex) - simple - TS", () => {
	BytecodeTS.from(simpleHex);
});

bench("from(hex) - simple - WASM", () => {
	BytecodeWasm.from(simpleHex);
});

await run();

bench("from(hex) - medium - TS", () => {
	BytecodeTS.from(mediumHex);
});

bench("from(hex) - medium - WASM", () => {
	BytecodeWasm.from(mediumHex);
});

await run();

bench("fromHex - large - TS", () => {
	BytecodeTS.fromHex(largeHex);
});

bench("fromHex - large - WASM", () => {
	BytecodeWasm.fromHex(largeHex);
});

await run();

// ============================================================================
// analyzeJumpDestinations benchmarks
// ============================================================================

bench("analyzeJumpDestinations - simple - TS", () => {
	BytecodeTS.analyzeJumpDestinations(simpleCode);
});

bench("analyzeJumpDestinations - simple - WASM", () => {
	BytecodeWasm.analyzeJumpDestinations(simpleCode);
});

await run();

bench("analyzeJumpDestinations - jump - TS", () => {
	BytecodeTS.analyzeJumpDestinations(jumpCode);
});

bench("analyzeJumpDestinations - jump - WASM", () => {
	BytecodeWasm.analyzeJumpDestinations(jumpCode);
});

await run();

bench("analyzeJumpDestinations - dispatcher - TS", () => {
	BytecodeTS.analyzeJumpDestinations(dispatcherCode);
});

bench("analyzeJumpDestinations - dispatcher - WASM", () => {
	BytecodeWasm.analyzeJumpDestinations(dispatcherCode);
});

await run();

bench("analyzeJumpDestinations - medium - TS", () => {
	BytecodeTS.analyzeJumpDestinations(mediumCode);
});

bench("analyzeJumpDestinations - medium - WASM", () => {
	BytecodeWasm.analyzeJumpDestinations(mediumCode);
});

await run();

bench("analyzeJumpDestinations - large (10KB) - TS", () => {
	BytecodeTS.analyzeJumpDestinations(largeCode);
});

bench("analyzeJumpDestinations - large (10KB) - WASM", () => {
	BytecodeWasm.analyzeJumpDestinations(largeCode);
});

await run();

// ============================================================================
// isValidJumpDest benchmarks
// ============================================================================

bench("isValidJumpDest - simple - TS", () => {
	BytecodeTS.isValidJumpDest(jumpCode, 5);
});

bench("isValidJumpDest - simple - WASM", () => {
	BytecodeWasm.isValidJumpDest(jumpCode, 5);
});

await run();

bench("isValidJumpDest - medium - TS", () => {
	BytecodeTS.isValidJumpDest(mediumCode, 50);
});

bench("isValidJumpDest - medium - WASM", () => {
	BytecodeWasm.isValidJumpDest(mediumCode, 50);
});

await run();

bench("isValidJumpDest - large - TS", () => {
	BytecodeTS.isValidJumpDest(largeCode, 5000);
});

bench("isValidJumpDest - large - WASM", () => {
	BytecodeWasm.isValidJumpDest(largeCode, 5000);
});

await run();

// ============================================================================
// validate benchmarks
// ============================================================================

bench("validate - simple - TS", () => {
	BytecodeTS.validate(simpleCode);
});

bench("validate - simple - WASM", () => {
	try {
		BytecodeWasm.validate(simpleCode);
	} catch {
		// WASM throws on invalid, TS returns boolean
	}
});

await run();

bench("validate - dispatcher - TS", () => {
	BytecodeTS.validate(dispatcherCode);
});

bench("validate - dispatcher - WASM", () => {
	try {
		BytecodeWasm.validate(dispatcherCode);
	} catch {
		// WASM throws on invalid
	}
});

await run();

bench("validate - medium - TS", () => {
	BytecodeTS.validate(mediumCode);
});

bench("validate - medium - WASM", () => {
	try {
		BytecodeWasm.validate(mediumCode);
	} catch {
		// WASM throws on invalid
	}
});

await run();

bench("validate - large (10KB) - TS", () => {
	BytecodeTS.validate(largeCode);
});

bench("validate - large (10KB) - WASM", () => {
	try {
		BytecodeWasm.validate(largeCode);
	} catch {
		// WASM throws on invalid
	}
});

await run();

// ============================================================================
// analyze benchmarks (TS-only, comprehensive analysis)
// ============================================================================

bench("analyze - simple - TS", () => {
	BytecodeTS.analyze(simpleCode);
});

bench("analyze - simple - WASM", () => {
	BytecodeWasm.analyze(simpleCode);
});

await run();

bench("analyze - dispatcher - TS", () => {
	BytecodeTS.analyze(dispatcherCode);
});

bench("analyze - dispatcher - WASM", () => {
	BytecodeWasm.analyze(dispatcherCode);
});

await run();

bench("analyze - medium - TS", () => {
	BytecodeTS.analyze(mediumCode);
});

bench("analyze - medium - WASM", () => {
	BytecodeWasm.analyze(mediumCode);
});

await run();

bench("analyze - large (10KB) - TS", () => {
	BytecodeTS.analyze(largeCode);
});

bench("analyze - large (10KB) - WASM", () => {
	BytecodeWasm.analyze(largeCode);
});

await run();

// ============================================================================
// parseInstructions benchmarks
// ============================================================================

bench("parseInstructions - simple - TS", () => {
	BytecodeTS.parseInstructions(simpleCode);
});

bench("parseInstructions - simple - WASM", () => {
	BytecodeWasm.parseInstructions(simpleCode);
});

await run();

bench("parseInstructions - medium - TS", () => {
	BytecodeTS.parseInstructions(mediumCode);
});

bench("parseInstructions - medium - WASM", () => {
	BytecodeWasm.parseInstructions(mediumCode);
});

await run();

bench("parseInstructions - large (10KB) - TS", () => {
	BytecodeTS.parseInstructions(largeCode);
});

bench("parseInstructions - large (10KB) - WASM", () => {
	BytecodeWasm.parseInstructions(largeCode);
});

await run();

// ============================================================================
// toHex benchmarks
// ============================================================================

bench("toHex - simple - TS", () => {
	BytecodeTS.toHex(simpleCode);
});

bench("toHex - simple - WASM", () => {
	BytecodeWasm.toHex(simpleCode);
});

await run();

bench("toHex - medium - TS", () => {
	BytecodeTS.toHex(mediumCode);
});

bench("toHex - medium - WASM", () => {
	BytecodeWasm.toHex(mediumCode);
});

await run();

bench("toHex - large (10KB) - TS", () => {
	BytecodeTS.toHex(largeCode);
});

bench("toHex - large (10KB) - WASM", () => {
	BytecodeWasm.toHex(largeCode);
});

await run();

// ============================================================================
// hasMetadata benchmarks
// ============================================================================

// Bytecode with Solidity metadata
const codeWithMetadata = bc(
	new Uint8Array([
		0x60, 0x80, 0x60, 0x40, 0x52, 0xa2, 0x64, 0x69, 0x70, 0x66, 0x73, 0x00,
		0x33,
	]),
);

bench("hasMetadata - without metadata - TS", () => {
	BytecodeTS.hasMetadata(mediumCode);
});

bench("hasMetadata - without metadata - WASM", () => {
	BytecodeWasm.hasMetadata(mediumCode);
});

await run();

bench("hasMetadata - with metadata - TS", () => {
	BytecodeTS.hasMetadata(codeWithMetadata);
});

bench("hasMetadata - with metadata - WASM", () => {
	BytecodeWasm.hasMetadata(codeWithMetadata);
});

await run();

// ============================================================================
// isBytecodeBoundary benchmarks (WASM-only method)
// ============================================================================

bench("isBytecodeBoundary - small - WASM", () => {
	BytecodeWasm.isBytecodeBoundary(jumpCode, 0);
	BytecodeWasm.isBytecodeBoundary(jumpCode, 1);
	BytecodeWasm.isBytecodeBoundary(jumpCode, 2);
});

bench("isBytecodeBoundary - large - WASM", () => {
	BytecodeWasm.isBytecodeBoundary(largeCode, 0);
	BytecodeWasm.isBytecodeBoundary(largeCode, 5000);
	BytecodeWasm.isBytecodeBoundary(largeCode, 9999);
});

await run();
