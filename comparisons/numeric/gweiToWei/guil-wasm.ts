import { gweiToWei } from "../../src/primitives/numeric.js";

// Test data covering various gwei amounts
const testGwei1 = 1n; // 1 Gwei
const testGwei2 = 50n; // 50 Gwei (common gas price)
const testGwei3 = 100n; // 100 Gwei
const testGwei4 = 1000n; // 1000 Gwei (high gas)
const testGwei5 = 1000000000n; // 1 billion Gwei (1 ether)
const testGwei6 = 25n; // 25 Gwei
const testGwei7 = 200n; // 200 Gwei
const testGwei8 = 0n; // Zero gwei

export function main(): void {
	gweiToWei(testGwei1);
	gweiToWei(testGwei2);
	gweiToWei(testGwei3);
	gweiToWei(testGwei4);
	gweiToWei(testGwei5);
	gweiToWei(testGwei6);
	gweiToWei(testGwei7);
	gweiToWei(testGwei8);
}
