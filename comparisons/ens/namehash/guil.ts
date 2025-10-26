// Guil does not implement ENS utilities
// Use viem as fallback for benchmarking purposes
import { namehash } from "viem/ens";

const testData = "vitalik.eth";

export function main(): void {
	namehash(testData);
}
