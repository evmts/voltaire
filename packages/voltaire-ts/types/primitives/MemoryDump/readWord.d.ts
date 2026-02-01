/**
 * Read a 32-byte word from memory at the given offset
 *
 * @param {import('./MemoryDumpType.js').MemoryDumpType} dump - Memory dump
 * @param {number} offset - Byte offset to read from
 * @returns {Uint8Array} 32-byte word
 * @throws {Error} If offset is out of bounds or insufficient data
 *
 * @example
 * ```typescript
 * const word = MemoryDump.readWord(dump, 0); // First 32 bytes
 * const word2 = MemoryDump.readWord(dump, 32); // Second 32 bytes
 * ```
 */
export function readWord(dump: import("./MemoryDumpType.js").MemoryDumpType, offset: number): Uint8Array;
//# sourceMappingURL=readWord.d.ts.map