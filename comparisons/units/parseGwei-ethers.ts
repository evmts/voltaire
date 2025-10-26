import { parseUnits } from "ethers";

// Test data covering various scenarios
const testGwei1 = "1"; // 1 Gwei
const testGwei2 = "50"; // 50 Gwei (typical gas price)
const testGwei3 = "0.000000001"; // Smallest unit
const testGwei4 = "123.456789"; // Many decimals
const testGwei5 = "1000"; // 1000 Gwei
const testGwei6 = "0.999999999"; // Just under 1 Gwei

export function main(): void {
	parseUnits(testGwei1, 9);
	parseUnits(testGwei2, 9);
	parseUnits(testGwei3, 9);
	parseUnits(testGwei4, 9);
	parseUnits(testGwei5, 9);
	parseUnits(testGwei6, 9);
}
