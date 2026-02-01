/**
 * Memory state snapshot from EVM execution
 *
 * Represents the complete memory state at a point in EVM execution.
 * EVM memory is byte-addressable and grows dynamically, organized in 32-byte words.
 *
 * @example
 * ```typescript
 * const dump: MemoryDumpType = {
 *   data: new Uint8Array([...]), // Full memory contents
 *   length: 128, // Memory size in bytes
 * };
 * ```
 */
export type MemoryDumpType = {
    /**
     * Raw memory bytes - complete memory contents
     */
    readonly data: Uint8Array;
    /**
     * Total memory size in bytes
     */
    readonly length: number;
};
//# sourceMappingURL=MemoryDumpType.d.ts.map