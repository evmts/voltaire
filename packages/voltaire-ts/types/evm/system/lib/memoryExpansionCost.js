import { wordCount } from "./wordCount.js";
/**
 * Calculate memory expansion cost
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} endBytes
 * @returns {bigint}
 */
export function memoryExpansionCost(frame, endBytes) {
    const currentSize = frame.memorySize;
    if (endBytes <= currentSize)
        return 0n;
    // Cap memory size to prevent overflow (16MB max)
    const maxMemory = 0x1000000;
    if (endBytes > maxMemory)
        return BigInt(Number.MAX_SAFE_INTEGER);
    // Calculate cost for new size
    const newWords = wordCount(endBytes);
    const newCost = BigInt(newWords * 3) + BigInt(Math.floor((newWords * newWords) / 512));
    // Calculate cost for current size
    const currentWords = wordCount(currentSize);
    const currentCost = BigInt(currentWords * 3) +
        BigInt(Math.floor((currentWords * currentWords) / 512));
    return newCost - currentCost;
}
