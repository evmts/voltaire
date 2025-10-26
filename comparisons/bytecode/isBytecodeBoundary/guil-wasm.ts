// Import directly to avoid hex.ts FFI issues in Node.js benchmarks
import {
	COMPLEX_BYTECODE,
	LARGE_BYTECODE,
	SIMPLE_BYTECODE,
} from "../test-data.js";

// Inline implementation to avoid Bun FFI imports
const PUSH1 = 0x60;
const PUSH32 = 0x7f;

function isBytecodeBoundary(bytecode: Uint8Array, position: number): boolean {
	if (position >= bytecode.length) {
		return false;
	}

	let i = 0;
	while (i < bytecode.length) {
		if (i === position) {
			return true;
		}

		if (i > position) {
			return false;
		}

		const opcode = bytecode[i];

		if (opcode >= PUSH1 && opcode <= PUSH32) {
			const pushSize = opcode - PUSH1 + 1;
			i += 1 + pushSize;
			continue;
		}

		i++;
	}

	return false;
}

export function main(): void {
	// Test with simple bytecode - check various positions
	isBytecodeBoundary(SIMPLE_BYTECODE, 0); // PUSH1
	isBytecodeBoundary(SIMPLE_BYTECODE, 1); // PUSH1 data (not boundary)
	isBytecodeBoundary(SIMPLE_BYTECODE, 2); // JUMPDEST

	// Test with complex bytecode
	isBytecodeBoundary(COMPLEX_BYTECODE, 0); // PUSH1
	isBytecodeBoundary(COMPLEX_BYTECODE, 5); // JUMPDEST
	isBytecodeBoundary(COMPLEX_BYTECODE, 10); // In PUSH32 data

	// Test with large bytecode
	isBytecodeBoundary(LARGE_BYTECODE, 0);
	isBytecodeBoundary(LARGE_BYTECODE, 50);
	isBytecodeBoundary(LARGE_BYTECODE, 100);
}
