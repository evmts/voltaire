// Import directly to avoid hex.ts FFI issues in Node.js benchmarks
import {
	COMPLEX_BYTECODE,
	INVALID_JUMPDEST_BYTECODE,
	LARGE_BYTECODE,
	SIMPLE_BYTECODE,
} from "../test-data.js";

// Inline implementation to avoid Bun FFI imports
const JUMPDEST = 0x5b;
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

function isValidJumpDest(bytecode: Uint8Array, position: number): boolean {
	if (position >= bytecode.length) {
		return false;
	}

	if (!isBytecodeBoundary(bytecode, position)) {
		return false;
	}

	return bytecode[position] === JUMPDEST;
}

export function main(): void {
	// Test with simple bytecode
	isValidJumpDest(SIMPLE_BYTECODE, 2); // Valid JUMPDEST
	isValidJumpDest(SIMPLE_BYTECODE, 5); // Valid JUMPDEST
	isValidJumpDest(SIMPLE_BYTECODE, 0); // Not a JUMPDEST

	// Test with complex bytecode
	isValidJumpDest(COMPLEX_BYTECODE, 5); // Valid JUMPDEST
	isValidJumpDest(COMPLEX_BYTECODE, 9); // Valid JUMPDEST
	isValidJumpDest(COMPLEX_BYTECODE, 10); // In PUSH32 data (invalid)

	// Test with invalid JUMPDEST positions
	isValidJumpDest(INVALID_JUMPDEST_BYTECODE, 1); // 0x5b in PUSH data (invalid)
	isValidJumpDest(INVALID_JUMPDEST_BYTECODE, 2); // Valid JUMPDEST

	// Test with large bytecode
	isValidJumpDest(LARGE_BYTECODE, 5);
	isValidJumpDest(LARGE_BYTECODE, 50);
	isValidJumpDest(LARGE_BYTECODE, 88);
}
