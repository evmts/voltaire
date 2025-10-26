import { namehash } from "viem/ens";

const testData = "vitalik.eth";

export function main(): void {
	namehash(testData);
}
