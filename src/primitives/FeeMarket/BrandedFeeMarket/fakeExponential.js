// @ts-nocheck

/**
 * Approximate exponential function using Taylor series
 * Internal helper for EIP-4844 blob fee calculation
 *
 * Approximates: factor * e^(numerator / denominator)
 * Using Taylor series: factor * (1 + x + x²/2! + x³/3! + ...)
 * where x = numerator / denominator
 *
 * @param {bigint} factor - Base factor (MIN_BLOB_BASE_FEE)
 * @param {bigint} numerator - Exponent numerator (excessBlobGas)
 * @param {bigint} denominator - Exponent denominator (BLOB_BASE_FEE_UPDATE_FRACTION)
 * @returns {bigint} Approximated result
 */
export function fakeExponential(factor, numerator, denominator) {
	let output = 0n;
	let numeratorAccum = factor * denominator;
	let i = 1n;

	// Taylor series: sum of (numerator^i) / (denominator^i * i!)
	while (numeratorAccum > 0n && i <= 256n) {
		output += numeratorAccum;
		numeratorAccum = (numeratorAccum * numerator) / (denominator * i);
		i += 1n;
	}

	return output / denominator;
}
