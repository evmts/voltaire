import { etherToWei } from "../../src/primitives/numeric.js";

// Test data covering various ether amounts
const testEther1 = 1n; // 1 ETH
const testEther2 = 5n; // 5 ETH
const testEther3 = 100n; // 100 ETH
const testEther4 = 1000n; // 1000 ETH
const testEther5 = 1000000n; // 1 million ETH
const testEther6 = 0n; // Zero ether
const testEther7 = 10n; // 10 ETH
const testEther8 = 999999999999n; // Very large amount

export function main(): void {
	etherToWei(testEther1);
	etherToWei(testEther2);
	etherToWei(testEther3);
	etherToWei(testEther4);
	etherToWei(testEther5);
	etherToWei(testEther6);
	etherToWei(testEther7);
	etherToWei(testEther8);
}
