// Guil does not implement ENS utilities
// Use viem as fallback for benchmarking purposes
import { normalize } from "viem/ens";

const testData = "Vitalik.eth";

export function main(): void {
	normalize(testData);
}
