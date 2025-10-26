import { type Hex, hexToBytes } from "viem";

const testHash: Hex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

export function main(): void {
	hexToBytes(testHash);
}
