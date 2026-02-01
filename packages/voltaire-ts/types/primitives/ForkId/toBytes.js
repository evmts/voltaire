/**
 * Encode ForkId to bytes (for DevP2P handshake)
 *
 * Format: [hash (4 bytes) || next (8 bytes big-endian)]
 *
 * @param {import('./ForkIdType.js').ForkIdType} forkId - ForkId to encode
 * @returns {Uint8Array} 12-byte encoding
 *
 * @example
 * ```typescript
 * const bytes = ForkId.toBytes(forkId);
 * console.log(bytes.length); // 12
 * ```
 */
export function toBytes(forkId) {
    const result = new Uint8Array(12);
    // Copy hash (4 bytes)
    result.set(forkId.hash, 0);
    // Encode next as 8-byte big-endian
    const next = forkId.next;
    const view = new DataView(result.buffer);
    view.setBigUint64(4, next, false); // false = big-endian
    return result;
}
