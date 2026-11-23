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
export const WASM_PAGE_SIZE = 65536;

/** Default bytes reserved for JS scratch at load time (1 MiB). */
export const DEFAULT_SCRATCH_RESERVE = 16 * WASM_PAGE_SIZE;

/** Half-open byte range `[start, end)` owned by JS scratch. */
export type ScratchChunk = { start: number; end: number };

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

function grow(memory: WebAssembly.Memory, bytes: number): ScratchChunk {
	const start = memory.buffer.byteLength;
	const pages = Math.ceil(bytes / WASM_PAGE_SIZE);
	try {
		memory.grow(pages);
	} catch (cause) {
		throw new Error(
			`Out of memory: failed to grow WASM memory by ${pages} pages from ${start} bytes`,
			{ cause },
		);
	}
	return { start, end: start + pages * WASM_PAGE_SIZE };
}

/**
 * Reserve a JS scratch region directly after the module's initial memory.
 * Call once, right after instantiation and before the module runs code that
 * might grow memory.
 *
 * @param memory - The module's exported memory
 * @param reserve - Bytes to reserve now and per later grow
 * @returns Scratch state; start offsets at `scratch.base`
 */
export function createScratch(
	memory: WebAssembly.Memory,
	reserve: number = DEFAULT_SCRATCH_RESERVE,
): Scratch {
	if (!Number.isInteger(reserve) || reserve < WASM_PAGE_SIZE) {
		throw new Error(
			`Scratch reserve must be an integer >= ${WASM_PAGE_SIZE}, got ${reserve}`,
		);
	}
	const first = grow(memory, reserve);
	return { memory, base: first.start, reserve, chunks: [first] };
}

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
export function scratchAlloc(
	scratch: Scratch,
	offset: number,
	size: number,
): { ptr: number; next: number } {
	if (!Number.isInteger(size) || size < 0) {
		throw new Error(`Invalid allocation size: ${size}`);
	}
	const aligned = Math.ceil(size / 8) * 8;
	const { chunks, memory } = scratch;
	const i = chunks.findIndex((c) => offset >= c.start && offset <= c.end);
	if (i < 0) {
		throw new Error(`Scratch offset ${offset} is outside JS scratch memory`);
	}
	const current = chunks[i] as ScratchChunk;
	if (offset + aligned <= current.end) {
		return { ptr: offset, next: offset + aligned };
	}
	for (let j = i + 1; j < chunks.length; j++) {
		const c = chunks[j] as ScratchChunk;
		if (c.end - c.start >= aligned) {
			return { ptr: c.start, next: c.start + aligned };
		}
	}
	const last = chunks[chunks.length - 1] as ScratchChunk;
	if (last === current && current.end === memory.buffer.byteLength) {
		// Nobody grew memory since our last chunk: extend it in place.
		const added = grow(
			memory,
			Math.max(scratch.reserve, offset + aligned - current.end),
		);
		current.end = added.end;
		return { ptr: offset, next: offset + aligned };
	}
	const added = grow(memory, Math.max(scratch.reserve, aligned));
	if (last.end === added.start) {
		last.end = added.end;
	} else {
		chunks.push(added);
	}
	return { ptr: added.start, next: added.start + aligned };
}
