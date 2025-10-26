// ethers doesn't have a dedicated bigint-to-bigint convertUnit function
// The formatUnits/parseUnits pattern is designed for string↔bigint conversion
// For bigint-to-bigint conversion, you would need to multiply/divide manually

// Unit constants matching ethers naming
const UNITS = {
	wei: 1n,
	kwei: 1000n,
	mwei: 1000000n,
	gwei: 1000000000n,
	szabo: 1000000000000n, // ethers uses szabo instead of microether
	finney: 1000000000000000n, // ethers uses finney instead of milliether
	ether: 1000000000000000000n,
} as const;

type Unit = keyof typeof UNITS;

// Test data covering various unit conversions
const testValue1 = 1n; // 1 unit
const testValue2 = 50n; // 50 units
const testValue3 = 1000000n; // 1 million units
const testValue4 = 1000000000000000000n; // 1 ether in wei
const testValue5 = 50000000000n; // 50 gwei in wei

// Manual bigint-to-bigint conversion since ethers doesn't provide this
function convertUnit(value: bigint, fromUnit: Unit, toUnit: Unit): bigint {
	const fromValue = UNITS[fromUnit];
	const toValue = UNITS[toUnit];
	return (value * fromValue) / toValue;
}

export function main(): void {
	// Wei to other units
	convertUnit(testValue4, "wei", "kwei");
	convertUnit(testValue4, "wei", "mwei");
	convertUnit(testValue4, "wei", "gwei");
	convertUnit(testValue4, "wei", "szabo");
	convertUnit(testValue4, "wei", "finney");
	convertUnit(testValue4, "wei", "ether");

	// Gwei to other units
	convertUnit(testValue2, "gwei", "wei");
	convertUnit(testValue2, "gwei", "kwei");
	convertUnit(testValue2, "gwei", "mwei");
	convertUnit(testValue2, "gwei", "szabo");
	convertUnit(testValue2, "gwei", "finney");
	convertUnit(testValue2, "gwei", "ether");

	// Ether to other units
	convertUnit(testValue1, "ether", "wei");
	convertUnit(testValue1, "ether", "kwei");
	convertUnit(testValue1, "ether", "mwei");
	convertUnit(testValue1, "ether", "gwei");
	convertUnit(testValue1, "ether", "szabo");
	convertUnit(testValue1, "ether", "finney");

	// Cross conversions
	convertUnit(testValue3, "kwei", "mwei");
	convertUnit(testValue3, "mwei", "gwei");
	convertUnit(testValue3, "szabo", "finney");
	convertUnit(testValue3, "finney", "ether");
}
