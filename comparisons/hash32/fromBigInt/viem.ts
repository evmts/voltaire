import { toHex } from "viem";

const testBigInt =
	0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;

export function main(): void {
	// Convert bigint to 32-byte hex string
	toHex(testBigInt, { size: 32 });
}
