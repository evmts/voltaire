import { toBeHex, zeroPadValue } from "ethers";

const testBigInt =
	0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;

export function main(): void {
	// Convert to hex and ensure it's 32 bytes (64 hex chars + 0x)
	const hex = toBeHex(testBigInt);
	zeroPadValue(hex, 32);
}
