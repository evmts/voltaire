/**
 * MemoryDump Benchmarks: Voltaire TS
 *
 * Compares performance of memory dump operations.
 * MemoryDump represents EVM memory state during trace execution.
 */

import { bench, run } from "mitata";
import * as MemoryDump from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Small memory (64 bytes - 2 words)
const smallMemory = new Uint8Array(64);
for (let i = 0; i < 64; i++) {
	smallMemory[i] = i;
}

// Medium memory (256 bytes - 8 words)
const mediumMemory = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
	mediumMemory[i] = i % 256;
}

// Large memory (1KB - 32 words)
const largeMemory = new Uint8Array(1024);
for (let i = 0; i < 1024; i++) {
	largeMemory[i] = i % 256;
}

// Very large memory (4KB - 128 words)
const veryLargeMemory = new Uint8Array(4096);
for (let i = 0; i < 4096; i++) {
	veryLargeMemory[i] = i % 256;
}

// Pre-created memory dumps
const smallDump = MemoryDump.from(smallMemory);
const mediumDump = MemoryDump.from(mediumMemory);
const largeDump = MemoryDump.from(largeMemory);
const veryLargeDump = MemoryDump.from(veryLargeMemory);

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - 64 bytes - voltaire", () => {
	MemoryDump.from(smallMemory);
});

bench("from - 256 bytes - voltaire", () => {
	MemoryDump.from(mediumMemory);
});

bench("from - 1KB - voltaire", () => {
	MemoryDump.from(largeMemory);
});

bench("from - 4KB - voltaire", () => {
	MemoryDump.from(veryLargeMemory);
});

await run();

// ============================================================================
// readWord benchmarks
// ============================================================================

bench("readWord - offset 0 (small) - voltaire", () => {
	MemoryDump.readWord(smallDump, 0);
});

bench("readWord - offset 32 (small) - voltaire", () => {
	MemoryDump.readWord(smallDump, 32);
});

await run();

bench("readWord - offset 0 (medium) - voltaire", () => {
	MemoryDump.readWord(mediumDump, 0);
});

bench("readWord - offset 128 (medium) - voltaire", () => {
	MemoryDump.readWord(mediumDump, 128);
});

bench("readWord - offset 224 (medium) - voltaire", () => {
	MemoryDump.readWord(mediumDump, 224);
});

await run();

bench("readWord - offset 0 (large) - voltaire", () => {
	MemoryDump.readWord(largeDump, 0);
});

bench("readWord - offset 512 (large) - voltaire", () => {
	MemoryDump.readWord(largeDump, 512);
});

bench("readWord - offset 992 (large) - voltaire", () => {
	MemoryDump.readWord(largeDump, 992);
});

await run();

// ============================================================================
// slice benchmarks
// ============================================================================

bench("slice - 32 bytes (small) - voltaire", () => {
	MemoryDump.slice(smallDump, 0, 32);
});

bench("slice - 64 bytes (small) - voltaire", () => {
	MemoryDump.slice(smallDump, 0, 64);
});

await run();

bench("slice - 64 bytes (medium) - voltaire", () => {
	MemoryDump.slice(mediumDump, 0, 64);
});

bench("slice - 128 bytes (medium) - voltaire", () => {
	MemoryDump.slice(mediumDump, 64, 192);
});

bench("slice - 256 bytes (medium) - voltaire", () => {
	MemoryDump.slice(mediumDump, 0, 256);
});

await run();

bench("slice - 256 bytes (large) - voltaire", () => {
	MemoryDump.slice(largeDump, 0, 256);
});

bench("slice - 512 bytes (large) - voltaire", () => {
	MemoryDump.slice(largeDump, 256, 768);
});

bench("slice - 1KB (large) - voltaire", () => {
	MemoryDump.slice(largeDump, 0, 1024);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

bench("readWord - 8 words sequential - voltaire", () => {
	for (let i = 0; i < 8; i++) {
		MemoryDump.readWord(mediumDump, i * 32);
	}
});

bench("readWord - 32 words sequential - voltaire", () => {
	for (let i = 0; i < 32; i++) {
		MemoryDump.readWord(largeDump, i * 32);
	}
});

await run();

// Simulate reading function call arguments
bench("slice - calldata extraction - voltaire", () => {
	// Extract selector (4 bytes)
	MemoryDump.slice(largeDump, 0, 4);
	// Extract first arg (32 bytes)
	MemoryDump.slice(largeDump, 4, 36);
	// Extract second arg (32 bytes)
	MemoryDump.slice(largeDump, 36, 68);
});

await run();

// ============================================================================
// Combined operations (realistic scenarios)
// ============================================================================

bench("from + readWord - voltaire", () => {
	const dump = MemoryDump.from(mediumMemory);
	MemoryDump.readWord(dump, 64);
});

bench("from + slice - voltaire", () => {
	const dump = MemoryDump.from(mediumMemory);
	MemoryDump.slice(dump, 0, 128);
});

await run();
