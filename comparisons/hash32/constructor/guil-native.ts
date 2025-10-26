import { Hash32 } from "../../../native/primitives/branded-types/hash.js";

const testHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const testBytes = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	testBytes[i] = i;
}

export function main(): void {
	// Test both hex string and Uint8Array inputs
	Hash32(testHash as `0x${string}`);
	Hash32(testBytes);
}
