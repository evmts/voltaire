import { getBytes } from "ethers";

const testHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

export function main(): void {
	getBytes(testHash);
}
