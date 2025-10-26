// Using @noble/hashes as fallback for benchmark compatibility
// Note: The native Zig+FFI implementation is faster, but this allows cross-runtime comparison
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex as toHex } from "@noble/hashes/utils.js";

const testData = new Uint8Array([1, 2, 3, 4, 5]);

export function main(): void {
	const hash = keccak_256(testData);
	const hex = `0x${toHex(hash)}`;
}
