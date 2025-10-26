import { validateBytecode } from "../../../src/typescript/native/primitives/bytecode.native.js";
import {
	COMPLEX_BYTECODE,
	LARGE_BYTECODE,
	SIMPLE_BYTECODE,
	TRUNCATED_PUSH,
} from "../test-data.js";

export function main(): void {
	// Test with valid bytecode
	try {
		validateBytecode(SIMPLE_BYTECODE);
	} catch {}
	try {
		validateBytecode(COMPLEX_BYTECODE);
	} catch {}
	try {
		validateBytecode(LARGE_BYTECODE);
	} catch {}

	// Test with invalid bytecode (will throw)
	try {
		validateBytecode(TRUNCATED_PUSH);
	} catch {}
}
