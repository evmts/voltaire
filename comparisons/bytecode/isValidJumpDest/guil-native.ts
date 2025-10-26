import { isValidJumpDest } from "../../../src/typescript/native/primitives/bytecode.native.js";
import {
	SIMPLE_BYTECODE,
	COMPLEX_BYTECODE,
	LARGE_BYTECODE,
	INVALID_JUMPDEST_BYTECODE,
} from "../test-data.js";

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
