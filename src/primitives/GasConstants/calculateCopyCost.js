import { Copy } from "./constants.js";

/**
 * Calculate copy operation gas cost
 *
 * @param {bigint} size - Size of data to copy in bytes
 * @returns {bigint} Gas cost
 */
export function calculateCopyCost(size) {
	const words = (size + 31n) / 32n;
	return words * Copy;
}
