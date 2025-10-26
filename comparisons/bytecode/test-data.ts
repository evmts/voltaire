/**
 * Realistic EVM bytecode examples for benchmarking
 */

// Simple contract with JUMPDEST instructions
// PUSH1 0x00, JUMPDEST, PUSH1 0x01, JUMPDEST, STOP
export const SIMPLE_BYTECODE = new Uint8Array([
	0x60,
	0x00, // PUSH1 0x00
	0x5b, // JUMPDEST at position 2
	0x60,
	0x01, // PUSH1 0x01
	0x5b, // JUMPDEST at position 5
	0x00, // STOP
]);

export const SIMPLE_BYTECODE_HEX = "0x60005b60015b00";

// Complex contract with multiple PUSH operations
// This simulates a more realistic contract with various PUSH sizes
export const COMPLEX_BYTECODE = new Uint8Array([
	0x60,
	0x80, // PUSH1 0x80 (free memory pointer)
	0x60,
	0x40, // PUSH1 0x40
	0x52, // MSTORE
	0x5b, // JUMPDEST at position 5
	0x61,
	0x01,
	0x00, // PUSH2 0x0100
	0x5b, // JUMPDEST at position 9
	0x7f,
	...new Array(32).fill(0xff), // PUSH32 (32 bytes of 0xff)
	0x5b, // JUMPDEST at position 42
	0x60,
	0x20, // PUSH1 0x20
	0x5b, // JUMPDEST at position 45
	0x00, // STOP
]);

export const COMPLEX_BYTECODE_HEX = `0x${Array.from(COMPLEX_BYTECODE)
	.map((b) => b.toString(16).padStart(2, "0"))
	.join("")}`;

// Bytecode with invalid JUMPDEST positions (JUMPDEST in PUSH data)
// PUSH1 0x5b (0x5b is data, not a valid JUMPDEST), JUMPDEST
export const INVALID_JUMPDEST_BYTECODE = new Uint8Array([
	0x60,
	0x5b, // PUSH1 0x5b (0x5b is data, not JUMPDEST)
	0x5b, // JUMPDEST at position 2 (this IS valid)
]);

export const INVALID_JUMPDEST_BYTECODE_HEX = "0x605b5b";

// Large bytecode sample simulating a real contract deployment
// Contains multiple functions with different PUSH operations
export const LARGE_BYTECODE = new Uint8Array([
	// Constructor section
	0x60,
	0x80, // PUSH1 0x80
	0x60,
	0x40, // PUSH1 0x40
	0x52, // MSTORE
	0x5b, // JUMPDEST at position 5

	// Function dispatch
	0x61,
	0x00,
	0x50, // PUSH2 0x0050
	0x56, // JUMP
	0x5b, // JUMPDEST at position 10

	// Function 1
	0x60,
	0x00, // PUSH1 0x00
	0x5b, // JUMPDEST at position 13
	0x7f,
	...new Array(32).fill(0xaa), // PUSH32
	0x5b, // JUMPDEST at position 46

	// Function 2
	0x61,
	0x01,
	0x00, // PUSH2 0x0100
	0x5b, // JUMPDEST at position 50
	0x62,
	0x00,
	0x10,
	0x00, // PUSH3 0x001000
	0x5b, // JUMPDEST at position 55

	// Function 3
	0x7f,
	...new Array(32).fill(0xbb), // PUSH32
	0x5b, // JUMPDEST at position 88
	0x7f,
	...new Array(32).fill(0xcc), // PUSH32
	0x5b, // JUMPDEST at position 121

	// Return section
	0x60,
	0x00, // PUSH1 0x00
	0x80, // DUP1
	0xf3, // RETURN
]);

export const LARGE_BYTECODE_HEX = `0x${Array.from(LARGE_BYTECODE)
	.map((b) => b.toString(16).padStart(2, "0"))
	.join("")}`;

// Truncated PUSH (invalid bytecode)
export const TRUNCATED_PUSH = new Uint8Array([0x60]); // PUSH1 without data
export const TRUNCATED_PUSH_HEX = "0x60";

// Valid empty bytecode
export const EMPTY_BYTECODE = new Uint8Array([]);
export const EMPTY_BYTECODE_HEX = "0x";
