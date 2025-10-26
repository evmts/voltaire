import { formatGwei } from "viem";

// Test data covering various scenarios
const testWei1 = 1000000000n; // 1 Gwei
const testWei2 = 50000000000n; // 50 Gwei (typical gas price)
const testWei3 = 1n; // Smallest unit
const testWei4 = 123456789n; // Many decimals
const testWei5 = 1000000000000n; // 1000 Gwei
const testWei6 = 999999999n; // Just under 1 Gwei

export function main(): void {
	formatGwei(testWei1);
	formatGwei(testWei2);
	formatGwei(testWei3);
	formatGwei(testWei4);
	formatGwei(testWei5);
	formatGwei(testWei6);
}
