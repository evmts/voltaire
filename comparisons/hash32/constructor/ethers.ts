import { getBytes, hexlify } from "ethers";

const testHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const testBytes = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	testBytes[i] = i;
}

export function main(): void {
	// Ethers doesn't have branded types - just validates and normalizes
	// For hex string: ensure it's 32 bytes
	const fromHex = getBytes(testHash);
	if (fromHex.length !== 32) {
		throw new Error("Invalid hash32 length");
	}

	// For Uint8Array: convert to hex
	if (testBytes.length !== 32) {
		throw new Error("Invalid hash32 length");
	}
	hexlify(testBytes);
}
