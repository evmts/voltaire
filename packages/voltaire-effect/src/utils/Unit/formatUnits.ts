/**
 * @fileoverview Format bigint to decimal string with specified decimals.
 * @module utils/Unit/formatUnits
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { UnitError } from "./errors.js";

/**
 * Formats a bigint value to a decimal string with the specified number of decimals.
 *
 * @param value - The bigint value in the smallest unit
 * @param decimals - Number of decimal places (e.g., 18 for ether)
 * @returns Effect yielding the formatted decimal string
 *
 * @example
 * ```typescript
 * // Format 1500000000000000000n with 18 decimals → "1.5"
 * const ether = yield* formatUnits(1500000000000000000n, 18)
 * ```
 */
export const formatUnits = (
	value: bigint,
	decimals: number,
): Effect.Effect<string, UnitError> =>
	Effect.try({
		try: () => {
			if (decimals < 0) {
				throw new Error("Decimals must be non-negative");
			}

			const negative = value < 0n;
			const abs = negative ? -value : value;

			const str = abs.toString().padStart(decimals + 1, "0");
			const integerPart = str.slice(0, str.length - decimals) || "0";
			const decimalPart = str.slice(str.length - decimals);

			// Remove trailing zeros from decimal part
			const trimmedDecimal = decimalPart.replace(/0+$/, "");

			const result = trimmedDecimal
				? `${integerPart}.${trimmedDecimal}`
				: integerPart;

			return negative ? `-${result}` : result;
		},
		catch: (e) =>
			new UnitError({
				operation: "formatUnits",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});
