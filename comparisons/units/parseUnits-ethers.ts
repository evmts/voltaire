import { parseUnits } from "ethers";

// Test data covering various decimals scenarios
const testValue1 = "1"; // Simple 1
const testValue2 = "1.5"; // Decimal value
const testValue3 = "0.000001"; // Small value (USDC)
const testValue4 = "123.456789"; // Many decimals
const testValue5 = "1000000"; // Large value
const testValue6 = "0.00000001"; // Smallest BTC unit

export function main(): void {
	// Test with 18 decimals (ETH standard)
	parseUnits(testValue1, 18);
	parseUnits(testValue2, 18);
	parseUnits(testValue4, 18);
	parseUnits(testValue5, 18);

	// Test with 6 decimals (USDC standard)
	parseUnits(testValue1, 6);
	parseUnits(testValue3, 6);

	// Test with 8 decimals (BTC standard)
	parseUnits(testValue1, 8);
	parseUnits(testValue6, 8);

	// Test with 0 decimals
	parseUnits(testValue1, 0);
	parseUnits(testValue5, 0);

	// Test edge cases
	parseUnits("0.000000000000000001", 18);
	parseUnits("999999.999999", 6);
}
