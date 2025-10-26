import { formatEther } from "../../src/primitives/units/index.js";

// Test data covering various scenarios
const testWei1 = 1000000000000000000n; // 1 ETH
const testWei2 = 1500000000000000000n; // 1.5 ETH
const testWei3 = 1n; // Smallest unit
const testWei4 = 123456789123456789n; // Many decimals
const testWei5 = 1000000000000000000000000n; // 1 million ETH
const testWei6 = 999999999999999999n; // Just under 1 ETH

export function main(): void {
	formatEther(testWei1);
	formatEther(testWei2);
	formatEther(testWei3);
	formatEther(testWei4);
	formatEther(testWei5);
	formatEther(testWei6);
}
