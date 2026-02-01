/**
 * Create MemoryDump from raw bytes or object
 *
 * @param {Uint8Array | { data: Uint8Array; length?: number }} value - Memory data or object
 * @returns {import('./MemoryDumpType.js').MemoryDumpType} MemoryDump
 *
 * @example
 * ```typescript
 * const dump1 = MemoryDump.from(new Uint8Array(64));
 * const dump2 = MemoryDump.from({ data: new Uint8Array(64), length: 64 });
 * ```
 */
export function from(value: Uint8Array | {
    data: Uint8Array;
    length?: number;
}): import("./MemoryDumpType.js").MemoryDumpType;
//# sourceMappingURL=from.d.ts.map