import { describe, expect, it } from "vitest";
import {
	createScratch,
	DEFAULT_SCRATCH_RESERVE,
	scratchAlloc,
	WASM_PAGE_SIZE,
} from "./scratch.js";

const PAGE = WASM_PAGE_SIZE;

function memoryOf(pages: number): WebAssembly.Memory {
	return new WebAssembly.Memory({ initial: pages, maximum: 1024 });
}

describe("createScratch", () => {
	it("reserves scratch directly after the module's initial memory", () => {
		const memory = memoryOf(256); // 16 MiB, like a module with static data at 16 MiB
		const scratch = createScratch(memory);
		expect(scratch.base).toBe(256 * PAGE);
		expect(memory.buffer.byteLength).toBe(256 * PAGE + DEFAULT_SCRATCH_RESERVE);
		expect(scratch.chunks).toEqual([
			{ start: 256 * PAGE, end: 256 * PAGE + DEFAULT_SCRATCH_RESERVE },
		]);
	});

	it("rejects a reserve smaller than one page", () => {
		expect(() => createScratch(memoryOf(1), 100)).toThrow(/reserve/);
	});
});

describe("scratchAlloc", () => {
	it("never returns a pointer inside module-owned memory", () => {
		const memory = memoryOf(4);
		const scratch = createScratch(memory, PAGE);
		let offset = scratch.base;
		for (let i = 0; i < 100; i++) {
			const { ptr, next } = scratchAlloc(scratch, offset, 4000);
			expect(ptr).toBeGreaterThanOrEqual(4 * PAGE);
			expect(next).toBeLessThanOrEqual(memory.buffer.byteLength);
			offset = next;
		}
	});

	it("aligns to 8 bytes", () => {
		const scratch = createScratch(memoryOf(1), PAGE);
		const a = scratchAlloc(scratch, scratch.base, 3);
		expect(a.next - a.ptr).toBe(8);
		const b = scratchAlloc(scratch, a.next, 9);
		expect(b.ptr).toBe(a.next);
		expect(b.next - b.ptr).toBe(16);
	});

	it("extends the chunk in place when nobody else grew memory", () => {
		const memory = memoryOf(1);
		const scratch = createScratch(memory, PAGE);
		const a = scratchAlloc(scratch, scratch.base, PAGE - 8);
		const b = scratchAlloc(scratch, a.next, 64);
		expect(b.ptr).toBe(a.next);
		expect(scratch.chunks).toHaveLength(1);
		expect(scratch.chunks[0]?.end).toBe(memory.buffer.byteLength);
	});

	it("skips pages the module grew after the scratch chunk", () => {
		const memory = memoryOf(1);
		const scratch = createScratch(memory, PAGE);
		const a = scratchAlloc(scratch, scratch.base, PAGE - 8);
		// Module grows memory for its own heap (e.g. sbrk / page allocator).
		const moduleStart = memory.grow(2) * PAGE;
		const moduleEnd = moduleStart + 2 * PAGE;
		const b = scratchAlloc(scratch, a.next, 64);
		expect(b.ptr).toBeGreaterThanOrEqual(moduleEnd);
		expect(scratch.chunks).toHaveLength(2);
		// Saved offsets from the first chunk stay valid after reset.
		const c = scratchAlloc(scratch, scratch.base, 16);
		expect(c.ptr).toBe(scratch.base);
		// Overflowing the first chunk again reuses the second chunk.
		const d = scratchAlloc(scratch, a.next, 64);
		expect(d.ptr).toBe(scratch.chunks[1]?.start);
	});

	it("grows enough pages for a large allocation", () => {
		const memory = memoryOf(1);
		const scratch = createScratch(memory, PAGE);
		const { ptr, next } = scratchAlloc(scratch, scratch.base, 5 * PAGE);
		expect(ptr).toBe(scratch.base);
		expect(next).toBeLessThanOrEqual(memory.buffer.byteLength);
	});

	it("rejects an offset outside JS scratch", () => {
		const scratch = createScratch(memoryOf(4), PAGE);
		expect(() => scratchAlloc(scratch, 64 * 1024, 8)).toThrow(/outside/);
	});

	it("reports out of memory when the maximum is reached", () => {
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 2 });
		const scratch = createScratch(memory, PAGE);
		expect(() => scratchAlloc(scratch, scratch.base, 2 * PAGE)).toThrow(
			/Out of memory/,
		);
	});
});
