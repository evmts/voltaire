/**
 * Check if error indicates block range is too large
 * @param {unknown} error
 * @returns {boolean}
 */
export function isBlockRangeTooLargeError(error) {
    if (!error || typeof error !== "object")
        return false;
    const msg = "message" in error && typeof error.message === "string"
        ? error.message.toLowerCase()
        : "";
    const code = "code" in error ? error.code : undefined;
    return (msg.includes("block range") ||
        msg.includes("too large") ||
        msg.includes("limit exceeded") ||
        msg.includes("query returned more than") ||
        code === -32005);
}
