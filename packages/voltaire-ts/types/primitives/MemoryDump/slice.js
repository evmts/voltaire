/**
 * Extract a slice of memory
 *
 * @param {import('./MemoryDumpType.js').MemoryDumpType} dump - Memory dump
 * @param {number} start - Start offset (inclusive)
 * @param {number} [end] - End offset (exclusive, defaults to length)
 * @returns {Uint8Array} Memory slice
 * @throws {Error} If offsets are invalid
 *
 * @example
 * ```typescript
 * const slice = MemoryDump.slice(dump, 0, 64); // First 64 bytes
 * const tail = MemoryDump.slice(dump, 64); // From byte 64 to end
 * ```
 */
export function slice(dump, start, end) {
    if (start < 0 || start > dump.length) {
        throw new Error(`Start offset ${start} out of bounds (length: ${dump.length})`);
    }
    const endOffset = end ?? dump.length;
    if (endOffset < start || endOffset > dump.length) {
        throw new Error(`End offset ${endOffset} invalid (start: ${start}, length: ${dump.length})`);
    }
    return dump.data.slice(start, endOffset);
}
