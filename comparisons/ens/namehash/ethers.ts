import { namehash } from "ethers";

const testData = "vitalik.eth";

export function main(): void {
	namehash(testData);
}
