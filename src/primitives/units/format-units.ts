/**
 * Format wei to human-readable units with specified decimals
 *
 * @param wei - Wei amount as bigint
 * @param decimals - Number of decimal places (0-77)
 * @returns Formatted amount as string
 *
 * @example
 * formatUnits(1000000000000000000n, 18) // "1"
 * formatUnits(123456789n, 9) // "0.123456789"
 * formatUnits(1500000000000000000n, 18) // "1.5"
 * formatUnits(-1000000000000000000n, 18) // "-1"
 */
export function formatUnits(wei: bigint, decimals: number): string {
	if (decimals < 0 || decimals > 77) {
		throw new Error(`Invalid decimals: ${decimals} (must be 0-77)`);
	}

	if (!Number.isInteger(decimals)) {
		throw new Error(`Decimals must be an integer: ${decimals}`);
	}

	// Handle zero case
	if (wei === 0n) {
		return "0";
	}

	// Handle negative values
	const isNegative = wei < 0n;
	const absWei = isNegative ? -wei : wei;

	// Calculate the divisor (10^decimals)
	const divisor = 10n ** BigInt(decimals);

	// Split into whole and fractional parts
	const wholePart = absWei / divisor;
	const fractionalPart = absWei % divisor;

	// If no fractional part, return just the whole number
	if (fractionalPart === 0n) {
		return (isNegative ? "-" : "") + wholePart.toString();
	}

	// Pad fractional part with leading zeros to match decimal places
	const fractionalStr = fractionalPart.toString().padStart(decimals, "0");

	// Remove trailing zeros
	const trimmed = fractionalStr.replace(/0+$/, "");

	return (isNegative ? "-" : "") + wholePart.toString() + "." + trimmed;
}
