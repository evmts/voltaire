/**
 * Sleep for specified milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
