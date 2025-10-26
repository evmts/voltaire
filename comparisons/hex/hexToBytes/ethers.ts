import { getBytes } from "ethers";

const testHex = "0x1234567890abcdef";

export function main(): void {
	getBytes(testHex);
}
