import { formatUnits, parseUnits } from "viem";

// Test data covering various unit conversions
const testValue1 = 1n; // 1 unit
const testValue2 = 50n; // 50 units
const testValue3 = 1000000n; // 1 million units
const testValue4 = 1000000000000000000n; // 1 ether in wei
const testValue5 = 50000000000n; // 50 gwei in wei

// Helper to convert between units using viem
// viem doesn't have a direct convertUnit function, so we format then parse
function convertUnit(value: bigint, fromUnit: string, toUnit: string): bigint {
	const formatted = formatUnits(value, fromUnit as any);
	return parseUnits(formatted, toUnit as any);
}

export function main(): void {
	// Wei to other units
	convertUnit(testValue4, "wei", "kwei");
	convertUnit(testValue4, "wei", "mwei");
	convertUnit(testValue4, "wei", "gwei");
	convertUnit(testValue4, "wei", "microether");
	convertUnit(testValue4, "wei", "milliether");
	convertUnit(testValue4, "wei", "ether");

	// Gwei to other units
	convertUnit(testValue2, "gwei", "wei");
	convertUnit(testValue2, "gwei", "kwei");
	convertUnit(testValue2, "gwei", "mwei");
	convertUnit(testValue2, "gwei", "microether");
	convertUnit(testValue2, "gwei", "milliether");
	convertUnit(testValue2, "gwei", "ether");

	// Ether to other units
	convertUnit(testValue1, "ether", "wei");
	convertUnit(testValue1, "ether", "kwei");
	convertUnit(testValue1, "ether", "mwei");
	convertUnit(testValue1, "ether", "gwei");
	convertUnit(testValue1, "ether", "microether");
	convertUnit(testValue1, "ether", "milliether");

	// Cross conversions
	convertUnit(testValue3, "kwei", "mwei");
	convertUnit(testValue3, "mwei", "gwei");
	convertUnit(testValue3, "microether", "milliether");
	convertUnit(testValue3, "milliether", "ether");
}
