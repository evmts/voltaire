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
export function toBytes(forkId: import("./ForkIdType.js").ForkIdType): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map