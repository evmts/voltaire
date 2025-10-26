import { parseEther } from "viem";

// Test data covering various scenarios
const testEther1 = "1"; // 1 ETH
const testEther2 = "1.5"; // 1.5 ETH
const testEther3 = "0.000000000000000001"; // Smallest unit
const testEther4 = "123.456789123456789"; // Many decimals
const testEther5 = "1000000"; // 1 million ETH
const testEther6 = "0.999999999999999999"; // Just under 1 ETH

export function main(): void {
	parseEther(testEther1);
	parseEther(testEther2);
	parseEther(testEther3);
	parseEther(testEther4);
	parseEther(testEther5);
	parseEther(testEther6);
}
