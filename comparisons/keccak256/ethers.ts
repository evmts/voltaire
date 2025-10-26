import { keccak256 } from "ethers";

const testData = new Uint8Array([1, 2, 3, 4, 5]);

export function main(): void {
	keccak256(testData);
}
