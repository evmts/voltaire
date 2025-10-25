/**
 * Parse a human-readable value string to wei with specified decimals
 *
 * @param value - Value as string (e.g., "1.5", "0.123456789")
 * @param decimals - Number of decimal places (0-77)
 * @returns Wei amount as bigint
 *
 * @example
 * parseUnits("1", 18) // 1000000000000000000n
 * parseUnits("0.123456789", 9) // 123456789n
 * parseUnits("1.5", 18) // 1500000000000000000n
 * parseUnits("-1", 18) // -1000000000000000000n
 */
export function parseUnits(value: string, decimals: number): bigint {
	if (decimals < 0 || decimals > 77) {
		throw new Error(`Invalid decimals: ${decimals} (must be 0-77)`);
	}

	if (!Number.isInteger(decimals)) {
		throw new Error(`Decimals must be an integer: ${decimals}`);
	}

	// Validate input string
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`Invalid value: must be a non-empty string`);
	}

	const trimmed = value.trim();

	// Handle negative values
	const isNegative = trimmed.startsWith("-");
	const absoluteValue = isNegative ? trimmed.slice(1) : trimmed;

	// Split by decimal point
	const parts = absoluteValue.split(".");

	if (parts.length > 2) {
		throw new Error(`Invalid value: multiple decimal points in "${value}"`);
	}

	const wholePart = parts[0] || "0";
	const fractionalPart = parts[1] || "";

	// Validate characters (must be digits only)
	if (!/^\d+$/.test(wholePart)) {
		throw new Error(`Invalid whole part: "${wholePart}" in "${value}"`);
	}

	if (fractionalPart && !/^\d+$/.test(fractionalPart)) {
		throw new Error(
			`Invalid fractional part: "${fractionalPart}" in "${value}"`,
		);
	}

	// Check if fractional part exceeds allowed decimals
	if (fractionalPart.length > decimals) {
		throw new Error(
			`Too many decimal places: ${fractionalPart.length} (max ${decimals})`,
		);
	}

	// Pad fractional part to match decimals
	const paddedFractional = fractionalPart.padEnd(decimals, "0");

	// Combine whole and fractional parts
	const combined = wholePart + paddedFractional;

	// Convert to bigint
	const result = BigInt(combined);

	return isNegative ? -result : result;
}
