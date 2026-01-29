/**
 * Benchmark: TypeScript vs WASM Opcode implementations
 * Compares performance of Opcode operations across different backends
 *
 * Note: WASM implementation currently re-exports TS (WASM not needed for opcodes).
 * This benchmark validates that assumption and provides baseline measurements.
 */

import { bench, run } from "mitata";
import * as Opcode from "./index.js";
import * as OpcodeWasm from "./Opcode.wasm.js";

// Test opcodes covering different categories
const PUSH1 = Opcode.PUSH1; // 0x60
const ADD = Opcode.ADD; // 0x01
const CALL = Opcode.CALL; // 0xf1
const SSTORE = Opcode.SSTORE; // 0x55
const _JUMPDEST = Opcode.JUMPDEST; // 0x5b
const DUP1 = Opcode.DUP1; // 0x80
const SWAP1 = Opcode.SWAP1; // 0x90
const LOG2 = Opcode.LOG2; // 0xa2
const INVALID = Opcode.INVALID; // 0xfe

// Bytecode samples for parse benchmarks
const simpleBytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]); // PUSH1 1 PUSH1 2 ADD
const mediumBytecode = new Uint8Array(100);
for (let i = 0; i < 100; i++) {
	mediumBytecode[i] = i % 256;
}
const largeBytecode = new Uint8Array(1000);
for (let i = 0; i < 1000; i++) {
	largeBytecode[i] = i % 256;
}

// ============================================================================
// getName benchmarks
// ============================================================================

bench("getName - PUSH1 - TS", () => {
	Opcode.getName(PUSH1);
});

bench("getName - PUSH1 - WASM", () => {
	OpcodeWasm.getName(PUSH1);
});

bench("getName - ADD - TS", () => {
	Opcode.getName(ADD);
});

bench("getName - ADD - WASM", () => {
	OpcodeWasm.getName(ADD);
});

bench("getName - CALL - TS", () => {
	Opcode.getName(CALL);
});

bench("getName - CALL - WASM", () => {
	OpcodeWasm.getName(CALL);
});

await run();

// ============================================================================
// getGasCost benchmarks
// ============================================================================

bench("getGasCost - ADD - TS", () => {
	Opcode.getGasCost(ADD);
});

bench("getGasCost - ADD - WASM", () => {
	OpcodeWasm.getGasCost(ADD);
});

bench("getGasCost - SSTORE - TS", () => {
	Opcode.getGasCost(SSTORE);
});

bench("getGasCost - SSTORE - WASM", () => {
	OpcodeWasm.getGasCost(SSTORE);
});

bench("getGasCost - CALL - TS", () => {
	Opcode.getGasCost(CALL);
});

bench("getGasCost - CALL - WASM", () => {
	OpcodeWasm.getGasCost(CALL);
});

await run();

// ============================================================================
// isValid / isValidOpcode benchmarks
// ============================================================================

bench("isValidOpcode - ADD - TS", () => {
	Opcode.isValidOpcode(ADD);
});

bench("isValidOpcode - ADD - WASM", () => {
	OpcodeWasm.isValidOpcode(ADD);
});

bench("isValidOpcode - INVALID - TS", () => {
	Opcode.isValidOpcode(INVALID);
});

bench("isValidOpcode - INVALID - WASM", () => {
	OpcodeWasm.isValidOpcode(INVALID);
});

await run();

// ============================================================================
// Category checks (isPush, isDup, isSwap, isLog)
// ============================================================================

bench("isPush - PUSH1 - TS", () => {
	Opcode.isPush(PUSH1);
});

bench("isPush - PUSH1 - WASM", () => {
	OpcodeWasm.isPush(PUSH1);
});

bench("isPush - ADD - TS", () => {
	Opcode.isPush(ADD);
});

bench("isPush - ADD - WASM", () => {
	OpcodeWasm.isPush(ADD);
});

await run();

bench("isDup - DUP1 - TS", () => {
	Opcode.isDup(DUP1);
});

bench("isDup - DUP1 - WASM", () => {
	OpcodeWasm.isDup(DUP1);
});

bench("isSwap - SWAP1 - TS", () => {
	Opcode.isSwap(SWAP1);
});

bench("isSwap - SWAP1 - WASM", () => {
	OpcodeWasm.isSwap(SWAP1);
});

bench("isLog - LOG2 - TS", () => {
	Opcode.isLog(LOG2);
});

bench("isLog - LOG2 - WASM", () => {
	OpcodeWasm.isLog(LOG2);
});

await run();

// ============================================================================
// pushBytes / getPushSize benchmarks
// ============================================================================

bench("pushBytes - PUSH1 - TS", () => {
	Opcode.pushBytes(PUSH1);
});

bench("pushBytes - PUSH1 - WASM", () => {
	OpcodeWasm.pushBytes(PUSH1);
});

bench("getPushSize - PUSH1 - TS", () => {
	Opcode.getPushSize(PUSH1);
});

bench("getPushSize - PUSH1 - WASM", () => {
	OpcodeWasm.getPushSize(PUSH1);
});

await run();

// ============================================================================
// parse benchmarks (bytecode parsing)
// ============================================================================

bench("parse - simple (5 bytes) - TS", () => {
	Opcode.parse(simpleBytecode);
});

bench("parse - simple (5 bytes) - WASM", () => {
	OpcodeWasm.parse(simpleBytecode);
});

await run();

bench("parse - medium (100 bytes) - TS", () => {
	Opcode.parse(mediumBytecode);
});

bench("parse - medium (100 bytes) - WASM", () => {
	OpcodeWasm.parse(mediumBytecode);
});

await run();

bench("parse - large (1000 bytes) - TS", () => {
	Opcode.parse(largeBytecode);
});

bench("parse - large (1000 bytes) - WASM", () => {
	OpcodeWasm.parse(largeBytecode);
});

await run();

// ============================================================================
// info benchmarks (full opcode metadata)
// ============================================================================

bench("info - ADD - TS", () => {
	Opcode.info(ADD);
});

bench("info - ADD - WASM", () => {
	OpcodeWasm.info(ADD);
});

bench("info - CALL - TS", () => {
	Opcode.info(CALL);
});

bench("info - CALL - WASM", () => {
	OpcodeWasm.info(CALL);
});

await run();

// ============================================================================
// dupPosition / swapPosition benchmarks
// ============================================================================

bench("dupPosition - DUP1 - TS", () => {
	Opcode.dupPosition(DUP1);
});

bench("dupPosition - DUP1 - WASM", () => {
	OpcodeWasm.dupPosition(DUP1);
});

bench("swapPosition - SWAP1 - TS", () => {
	Opcode.swapPosition(SWAP1);
});

bench("swapPosition - SWAP1 - WASM", () => {
	OpcodeWasm.swapPosition(SWAP1);
});

await run();

// ============================================================================
// isTerminating benchmarks
// ============================================================================

bench("isTerminating - STOP - TS", () => {
	Opcode.isTerminating(Opcode.STOP);
});

bench("isTerminating - STOP - WASM", () => {
	OpcodeWasm.isTerminating(OpcodeWasm.STOP);
});

bench("isTerminating - ADD - TS", () => {
	Opcode.isTerminating(ADD);
});

bench("isTerminating - ADD - WASM", () => {
	OpcodeWasm.isTerminating(ADD);
});

await run();

// ============================================================================
// isJump benchmarks
// ============================================================================

bench("isJump - JUMP - TS", () => {
	Opcode.isJump(Opcode.JUMP);
});

bench("isJump - JUMP - WASM", () => {
	OpcodeWasm.isJump(OpcodeWasm.JUMP);
});

bench("isJump - ADD - TS", () => {
	Opcode.isJump(ADD);
});

bench("isJump - ADD - WASM", () => {
	OpcodeWasm.isJump(ADD);
});

await run();
