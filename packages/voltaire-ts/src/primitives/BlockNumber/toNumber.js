/**
 * Convert BlockNumber to number (unsafe for large values)
 *
 * @param {import('./BlockNumberType.js').BlockNumberType} blockNumber
 * @returns {number}
 */
export function toNumber(blockNumber) {
	return Number(blockNumber);
}
