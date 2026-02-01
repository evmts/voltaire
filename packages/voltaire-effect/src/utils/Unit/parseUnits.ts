/**
 * @fileoverview Parse decimal string to bigint with specified decimals.
 * @module utils/Unit/parseUnits
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { UnitError } from "./errors.js";

/**
 * Parses a decimal string value to a bigint with the specified number of decimals.
 *
 * @param value - Decimal string (e.g., "1.5")
 * @param decimals - Number of decimal places (e.g., 18 for ether)
 * @returns Effect yielding the parsed bigint value
 *
 * @example
 * ```typescript
 * // Parse 1.5 with 18 decimals → 1500000000000000000n
 * const wei = yield* parseUnits("1.5", 18)
 * ```
 */
export const parseUnits = (
	value: string,
	decimals: number,
): Effect.Effect<bigint, UnitError> =>
	Effect.try({
		try: () => {
			const trimmed = value.trim();
			if (trimmed === "") {
				throw new Error("Empty value");
			}

			// Handle negative values
			const negative = trimmed.startsWith("-");
			const abs = negative ? trimmed.slice(1) : trimmed;

			// Split by decimal point
			const [integerPart = "0", decimalPart = ""] = abs.split(".");

			if (abs.split(".").length > 2) {
				throw new Error("Invalid number format: multiple decimal points");
			}

			// Validate parts contain only digits
			if (!/^\d*$/.test(integerPart) || !/^\d*$/.test(decimalPart)) {
				throw new Error("Invalid number format: non-digit characters");
			}

			// Truncate decimal part if longer than decimals
			const truncatedDecimal = decimalPart.slice(0, decimals);

			// Pad decimal part with zeros
			const paddedDecimal = truncatedDecimal.padEnd(decimals, "0");

			// Combine and parse
			const combined = integerPart + paddedDecimal;
			const result = BigInt(combined);

			return negative ? -result : result;
		},
		catch: (e) =>
			new UnitError({
				operation: "parseUnits",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});
