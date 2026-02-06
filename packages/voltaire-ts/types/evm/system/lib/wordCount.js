/**
 * Calculate the number of 32-byte words needed for a byte count
 * @param {number} bytes
 * @returns {number}
 */
export function wordCount(bytes) {
    return Math.ceil(bytes / 32);
}
