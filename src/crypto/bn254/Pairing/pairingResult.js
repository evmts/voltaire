/**
 * Pairing result utilities
 */

/**
 * Check if two pairing results are equal
 *
 * @param {{value: bigint}} a - First result
 * @param {{value: bigint}} b - Second result
 * @returns {boolean} True if equal
 */
export function pairingResultEqual(a, b) {
	return a.value === b.value;
}

/**
 * Get the identity element for pairing results
 *
 * @returns {{value: bigint}} Identity element
 */
export function pairingResultOne() {
	return { value: 1n };
}
