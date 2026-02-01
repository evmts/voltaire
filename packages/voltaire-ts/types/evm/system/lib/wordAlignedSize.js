import { wordCount } from "./wordCount.js";
/**
 * Calculate word-aligned size in bytes
 * @param {number} bytes
 * @returns {number}
 */
export function wordAlignedSize(bytes) {
    const words = wordCount(bytes);
    return words * 32;
}
