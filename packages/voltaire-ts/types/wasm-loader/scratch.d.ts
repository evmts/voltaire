/**
 * JS-owned scratch memory inside a WASM module's linear memory.
 *
 * The module owns every byte below its initial `memory.buffer.byteLength`
 * (stack, static data, heap) and every page it later grows itself. JS
 * scratch lives only in chunks JS grew: the first chunk is reserved at load
 * time directly after the module's initial memory, and later chunks are
 * appended by `memory.grow`. A pointer handed out by `scratchAlloc` never
 * falls inside module-owned memory.
 *
 * @since 0.0.0
 */
/** WASM page size in bytes. */
export declare const WASM_PAGE_SIZE = 65536;
/** Default bytes reserved for JS scratch at load time (1 MiB). */
export declare const DEFAULT_SCRATCH_RESERVE: number;
/** Half-open byte range `[start, end)` owned by JS scratch. */
export type ScratchChunk = {
    start: number;
    end: number;
};
/** JS scratch region bookkeeping for one WASM memory. */
export type Scratch = {
    readonly memory: WebAssembly.Memory;
    /** First JS-owned byte; equals the module's initial memory size. */
    readonly base: number;
    /** Bytes requested per grow when a chunk overflows. */
    readonly reserve: number;
    /** JS-owned chunks in address order. Never overlap module memory. */
    readonly chunks: ScratchChunk[];
};
/**
 * Reserve a JS scratch region directly after the module's initial memory.
 * Call once, right after instantiation and before the module runs code that
 * might grow memory.
 *
 * @param memory - The module's exported memory
 * @param reserve - Bytes to reserve now and per later grow
 * @returns Scratch state; start offsets at `scratch.base`
 */
export declare function createScratch(memory: WebAssembly.Memory, reserve?: number): Scratch;
/**
 * Bump-allocate `size` bytes (8-byte aligned) of JS scratch.
 *
 * `offset` is the current bump pointer; it must be `scratch.base` or a value
 * previously returned as `next`. Allocations that do not fit the chunk
 * holding `offset` move to the next JS chunk with room, or grow a new chunk
 * at the end of memory. Pages the module grew in between are skipped.
 *
 * @param scratch - Scratch state from `createScratch`
 * @param offset - Current bump pointer
 * @param size - Bytes requested
 * @returns `ptr` to use and `next` bump pointer
 * @throws {Error} If `offset` is not inside JS scratch or memory cannot grow
 */
export declare function scratchAlloc(scratch: Scratch, offset: number, size: number): {
    ptr: number;
    next: number;
};
//# sourceMappingURL=scratch.d.ts.map