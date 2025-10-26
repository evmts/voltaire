import { isBytecodeBoundary } from "../../../src/typescript/native/primitives/bytecode.native.js";
import {
	SIMPLE_BYTECODE,
	COMPLEX_BYTECODE,
	LARGE_BYTECODE,
} from "../test-data.js";

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
