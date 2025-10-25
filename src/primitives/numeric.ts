/**
 * Numeric utilities for Ethereum
 *
 * Provides unit conversion (wei, gwei, ether) and parsing/formatting.
 */

// Unit conversion constants
const UNITS = {
	wei: 1n,
	kwei: 1000n,
	mwei: 1000000n,
	gwei: 1000000000n,
	microether: 1000000000000n,
	milliether: 1000000000000000n,
	ether: 1000000000000000000n,
} as const;

export type Unit = keyof typeof UNITS;

/**
 * Parse ether string to wei
 * @param ether - Ether amount as string (e.g., "1.5")
 * @returns Wei amount as bigint
 */
export function parseEther(ether: string): bigint {
	return parseUnits(ether, "ether");
}

/**
 * Parse value with specific unit to wei
 * @param value - Value as string
 * @param unit - Unit type
 * @returns Wei amount as bigint
 */
export function parseUnits(value: string, unit: Unit = "ether"): bigint {
	const unitValue = UNITS[unit];
	const parts = value.split(".");

	if (parts.length > 2) {
		throw new Error("Invalid numeric string");
	}

	const wholePart = parts[0] || "0";
	const fractionalPart = parts[1] || "";

	// Calculate how many decimal places the unit supports
	const unitDecimals = unitValue.toString().length - 1;

	if (fractionalPart.length > unitDecimals) {
		throw new Error(
			`Too many decimal places for ${unit} (max ${unitDecimals})`,
		);
	}

	// Pad fractional part to match unit decimals
	const paddedFractional = fractionalPart.padEnd(unitDecimals, "0");

	// Combine whole and fractional parts
	const combined = wholePart + paddedFractional;

	return BigInt(combined);
}

/**
 * Format wei to ether string
 * @param wei - Wei amount as bigint
 * @returns Ether amount as string
 */
export function formatEther(wei: bigint): string {
	return formatUnits(wei, "ether");
}

/**
 * Format wei to specific unit string
 * @param wei - Wei amount as bigint
 * @param unit - Unit type
 * @returns Formatted amount as string
 */
export function formatUnits(wei: bigint, unit: Unit = "ether"): string {
	const unitValue = UNITS[unit];
	const unitDecimals = unitValue.toString().length - 1;

	const isNegative = wei < 0n;
	const absWei = isNegative ? -wei : wei;

	const wholePart = absWei / unitValue;
	const fractionalPart = absWei % unitValue;

	if (fractionalPart === 0n) {
		return (isNegative ? "-" : "") + wholePart.toString();
	}

	// Pad fractional part with leading zeros
	const fractionalStr = fractionalPart.toString().padStart(unitDecimals, "0");

	// Remove trailing zeros
	const trimmed = fractionalStr.replace(/0+$/, "");

	return (isNegative ? "-" : "") + wholePart.toString() + "." + trimmed;
}

/**
 * Convert between units
 * @param value - Value as bigint in fromUnit
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Value in target unit as bigint
 */
export function convertUnit(
	value: bigint,
	fromUnit: Unit,
	toUnit: Unit,
): bigint {
	const fromValue = UNITS[fromUnit];
	const toValue = UNITS[toUnit];

	return (value * fromValue) / toValue;
}

// Common conversions
export const gweiToWei = (gwei: bigint): bigint => gwei * UNITS.gwei;
export const weiToGwei = (wei: bigint): bigint => wei / UNITS.gwei;
export const etherToWei = (ether: bigint): bigint => ether * UNITS.ether;
export const weiToEther = (wei: bigint): bigint => wei / UNITS.ether;
