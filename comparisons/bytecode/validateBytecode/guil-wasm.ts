// Import directly to avoid hex.ts FFI issues in Node.js benchmarks
import {
	COMPLEX_BYTECODE,
	LARGE_BYTECODE,
	SIMPLE_BYTECODE,
	TRUNCATED_PUSH,
} from "../test-data.js";

// Inline implementation to avoid Bun FFI imports
const PUSH1 = 0x60;
const PUSH32 = 0x7f;

function validateBytecode(bytecode: Uint8Array): boolean {
	let i = 0;
	while (i < bytecode.length) {
		const opcode = bytecode[i];

		if (opcode >= PUSH1 && opcode <= PUSH32) {
			const pushSize = opcode - PUSH1 + 1;
			if (i + pushSize >= bytecode.length) {
				return false; // Truncated PUSH
			}
			i += 1 + pushSize;
			continue;
		}

		i++;
	}

	return true;
}

export function main(): void {
	// Test with valid bytecode
	validateBytecode(SIMPLE_BYTECODE);
	validateBytecode(COMPLEX_BYTECODE);
	validateBytecode(LARGE_BYTECODE);

	// Test with invalid bytecode
	validateBytecode(TRUNCATED_PUSH);
}
