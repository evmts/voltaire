import { hexToBigInt } from "viem";

const testHex = "0x1234567890abcdef";

export function main(): void {
	hexToBigInt(testHex);
}
