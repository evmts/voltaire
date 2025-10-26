// Import directly to avoid hex.ts FFI issues in Node.js benchmarks
import {
	SIMPLE_BYTECODE,
	COMPLEX_BYTECODE,
	LARGE_BYTECODE,
} from "../test-data.js";

// Inline implementation to avoid Bun FFI imports
interface JumpDestination {
	position: number;
	valid: boolean;
}

const JUMPDEST = 0x5b;
const PUSH1 = 0x60;
const PUSH32 = 0x7f;

function analyzeJumpDestinations(bytecode: Uint8Array): JumpDestination[] {
	const destinations: JumpDestination[] = [];

	let i = 0;
	while (i < bytecode.length) {
		const opcode = bytecode[i];

		if (opcode === JUMPDEST) {
			destinations.push({ position: i, valid: true });
			i++;
			continue;
		}

		if (opcode >= PUSH1 && opcode <= PUSH32) {
			const pushSize = opcode - PUSH1 + 1;
			i += 1 + pushSize;
			continue;
		}

		i++;
	}

	return destinations;
}

export function main(): void {
	// Test with simple bytecode
	analyzeJumpDestinations(SIMPLE_BYTECODE);

	// Test with complex bytecode
	analyzeJumpDestinations(COMPLEX_BYTECODE);

	// Test with large bytecode
	analyzeJumpDestinations(LARGE_BYTECODE);
}
