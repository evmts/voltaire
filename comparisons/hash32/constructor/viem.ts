import { type Hex, isHex, hexToBytes, bytesToHex } from "viem";

const testHash: Hex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const testBytes = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	testBytes[i] = i;
}

export function main(): void {
	// Viem uses Hex type but doesn't validate length at type level
	// Manual validation needed

	// For hex string: validate it's 32 bytes (66 chars)
	if (!isHex(testHash) || testHash.length !== 66) {
		throw new Error("Invalid hash32 format");
	}
	const fromHex = hexToBytes(testHash);

	// For Uint8Array: validate length and convert
	if (testBytes.length !== 32) {
		throw new Error("Invalid hash32 length");
	}
	bytesToHex(testBytes);
}
