// Guil does not implement ENS utilities
// Use viem as fallback for benchmarking purposes
import { labelhash } from "viem/ens";

const testData = "vitalik";

export function main(): void {
	labelhash(testData);
}
