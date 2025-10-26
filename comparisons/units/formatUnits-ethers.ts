import { formatUnits } from "ethers";

// Test data covering various decimals scenarios
const testWei1 = 1000000000000000000n; // 1 unit at 18 decimals
const testWei2 = 1000000n; // 1 unit at 6 decimals (USDC)
const testWei3 = 100000000n; // 1 unit at 8 decimals (BTC)
const testWei4 = 123456789123456789n; // Complex value
const testWei5 = 1n; // Smallest unit
const testWei6 = 1000000000000000000000000n; // Very large value

export function main(): void {
	// Test with 18 decimals (ETH standard)
	formatUnits(testWei1, 18);
	formatUnits(testWei4, 18);
	formatUnits(testWei6, 18);

	// Test with 6 decimals (USDC standard)
	formatUnits(testWei2, 6);
	formatUnits(1000000000n, 6);

	// Test with 8 decimals (BTC standard)
	formatUnits(testWei3, 8);

	// Test with 0 decimals
	formatUnits(testWei1, 0);

	// Test edge cases
	formatUnits(testWei5, 18);
	formatUnits(testWei5, 1);
}
