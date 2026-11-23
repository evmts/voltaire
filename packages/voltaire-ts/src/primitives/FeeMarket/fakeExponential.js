import { InvalidRangeError } from "../errors/index.js";

/**
 * Approximate exponential function using Taylor series (`fake_exponential` from EIP-4844).
 *
 * Approximates: `factor * e^(numerator / denominator)`
 * Using integer Taylor series: `factor * (1 + x + x²/2! + x³/3! + ...)`
 *
 * Runs the full Taylor series until the next term is 0 (matching
 * `ethereum/execution-specs` with no arbitrary iteration cap). When an optional
 * `maxResult` bound is supplied, stops early as soon as `output / denominator >= maxResult`
 * so reserve-price checks stay fast even for extreme `numerator` values.
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {bigint} factor - Base factor (MIN_BLOB_BASE_FEE)
 * @param {bigint} numerator - Exponent numerator (excessBlobGas)
 * @param {bigint} denominator - Exponent denominator (BLOB_BASE_FEE_UPDATE_FRACTION, must be > 0)
 * @param {bigint} [maxResult] - Optional early-exit upper bound
 * @returns {bigint} Approximated result (at least 1n for legacy callers, or `maxResult` if bounded)
 * @throws {InvalidRangeError} If `denominator <= 0n`
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const result = FeeMarket.fakeExponential(1n, 1000000n, 3338477n);
 * ```
 */
export function fakeExponential(factor, numerator, denominator, maxResult) {
	if (denominator <= 0n) {
		throw new InvalidRangeError(
			"fakeExponential denominator must be positive",
			{
				value: denominator,
				expected: "denominator > 0n",
				docsPath: "/primitives/feemarket",
			},
		);
	}

	const cap = maxResult !== undefined ? maxResult * denominator : undefined;
	let output = 0n;
	let numeratorAccum = factor * denominator;
	let i = 1n;

	while (numeratorAccum > 0n) {
		output += numeratorAccum;
		if (cap !== undefined && output >= cap) {
			return /** @type {bigint} */ (maxResult);
		}
		numeratorAccum = (numeratorAccum * numerator) / (denominator * i);
		i += 1n;
	}

	const result = output / denominator;

	// Per EIP-4844: minimum blob gas price is 1 (MIN_BLOB_BASE_FEE)
	// Ensure we never return 0 to prevent underflow in callers
	return result === 0n ? 1n : result;
}
