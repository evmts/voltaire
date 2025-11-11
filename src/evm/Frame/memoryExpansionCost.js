/**
 * Calculate word count from bytes
 * @param {number} bytes - Byte count
 * @returns {number} Word count
 */
function wordCount(bytes) {
	return Math.ceil(bytes / 32);
}

/**
 * Calculate memory expansion cost
 *
 * EVM memory cost formula: 3n + n²/512 where n is word count
 *
 * @param {import("./BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {number} endBytes - Target memory size in bytes
 * @returns {bigint} Additional gas cost for expansion
 */
export function memoryExpansionCost(frame, endBytes) {
	const currentSize = frame.memorySize;

	if (endBytes <= currentSize) return 0n;

	// Cap memory size to prevent overflow (16MB max)
	const maxMemory = 0x1000000;
	if (endBytes > maxMemory) return BigInt(Number.MAX_SAFE_INTEGER);

	// Calculate cost for new size
	const newWords = wordCount(endBytes);
	const newCost = BigInt(newWords * 3) + BigInt((newWords * newWords) / 512);

	// Calculate cost for current size
	const currentWords = wordCount(currentSize);
	const currentCost =
		BigInt(currentWords * 3) + BigInt((currentWords * currentWords) / 512);

	return newCost - currentCost;
}
