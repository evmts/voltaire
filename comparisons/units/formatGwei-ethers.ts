import { formatUnits } from "ethers";

// Test data covering various scenarios
const testWei1 = 1000000000n; // 1 Gwei
const testWei2 = 50000000000n; // 50 Gwei (typical gas price)
const testWei3 = 1n; // Smallest unit
const testWei4 = 123456789n; // Many decimals
const testWei5 = 1000000000000n; // 1000 Gwei
const testWei6 = 999999999n; // Just under 1 Gwei

export function main(): void {
	formatUnits(testWei1, 9);
	formatUnits(testWei2, 9);
	formatUnits(testWei3, 9);
	formatUnits(testWei4, 9);
	formatUnits(testWei5, 9);
	formatUnits(testWei6, 9);
}
