import { analyzeJumpDestinations } from "../../../src/typescript/native/primitives/bytecode.native.js";
import {
	SIMPLE_BYTECODE,
	COMPLEX_BYTECODE,
	LARGE_BYTECODE,
} from "../test-data.js";

export function main(): void {
	// Test with simple bytecode
	analyzeJumpDestinations(SIMPLE_BYTECODE);

	// Test with complex bytecode
	analyzeJumpDestinations(COMPLEX_BYTECODE);

	// Test with large bytecode
	analyzeJumpDestinations(LARGE_BYTECODE);
}
