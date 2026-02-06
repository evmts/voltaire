/**
 * Convert Uint8Array to hex string
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function bytesToHex(bytes) {
    return `0x${Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;
}
