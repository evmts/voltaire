/**
 * RuntimeCode Benchmarks - mitata format
 * Deployed contract runtime bytecode operations
 */

import { bench, run } from "mitata";
import * as RuntimeCode from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Minimal runtime code
const minimalCode = "0x6080604052600080fd00";

// Simple runtime code (getter function)
const simpleCode =
	"0x6080604052348015600f57600080fd5b506004361060285760003560e01c80632e64cec114602d575b600080fd5b60336047565b604051603e91906058565b60405180910390f35b60008054905090565b6052816071565b82525050565b6000602082019050606b6000830184604b565b92915050565b600081905091905056fea264697066735822";

// Medium runtime code
const mediumCode =
	"0x6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d14604f575b600080fd5b603d606b565b60405160489190607d565b60405180910390f35b6069600480360381019060659190608a565b6074565b005b60008054905090565b8060008190555050565b60828184609a565b92915050565b60006020828403121560a057600080fd5b600060ac8482850160af565b91505092915050565b600081359050609c8160c1565b92915050565b6000819050919050565b600060208284031215609557600080fd5b600060a1848285016098565b91505092915050565b609a8160a2565b8114609f57600080fd5b5056fea264697066735822";

// Large runtime code (~2KB)
const largeCode = `0x6080604052${"34".repeat(1000)}`;

// Bytes versions
const _minimalBytes = new Uint8Array([
	0x60, 0x80, 0x60, 0x40, 0x52, 0x60, 0x00, 0x80, 0xfd, 0x00,
]);

// Pre-created instances
const minimalInstance = RuntimeCode.from(minimalCode);
const simpleInstance = RuntimeCode.from(simpleCode);
const mediumInstance = RuntimeCode.from(mediumCode);
const largeInstance = RuntimeCode.from(largeCode);

// ============================================================================
// RuntimeCode.from - construction
// ============================================================================

bench("RuntimeCode.from(hex) - minimal - voltaire", () => {
	RuntimeCode.from(minimalCode);
});

bench("RuntimeCode.from(hex) - simple - voltaire", () => {
	RuntimeCode.from(simpleCode);
});

bench("RuntimeCode.from(hex) - medium - voltaire", () => {
	RuntimeCode.from(mediumCode);
});

bench("RuntimeCode.from(hex) - large (2KB) - voltaire", () => {
	RuntimeCode.from(largeCode);
});

await run();

// ============================================================================
// RuntimeCode.fromHex
// ============================================================================

bench("RuntimeCode.fromHex - minimal - voltaire", () => {
	RuntimeCode.fromHex(minimalCode);
});

bench("RuntimeCode.fromHex - simple - voltaire", () => {
	RuntimeCode.fromHex(simpleCode);
});

bench("RuntimeCode.fromHex - medium - voltaire", () => {
	RuntimeCode.fromHex(mediumCode);
});

await run();

// ============================================================================
// RuntimeCode.toHex
// ============================================================================

bench("RuntimeCode.toHex - minimal - voltaire", () => {
	RuntimeCode.toHex(minimalInstance);
});

bench("RuntimeCode.toHex - simple - voltaire", () => {
	RuntimeCode.toHex(simpleInstance);
});

bench("RuntimeCode.toHex - medium - voltaire", () => {
	RuntimeCode.toHex(mediumInstance);
});

bench("RuntimeCode.toHex - large - voltaire", () => {
	RuntimeCode.toHex(largeInstance);
});

await run();

// ============================================================================
// RuntimeCode.equals
// ============================================================================

const minimalInstance2 = RuntimeCode.from(minimalCode);

bench("RuntimeCode.equals - same - voltaire", () => {
	RuntimeCode.equals(minimalInstance, minimalInstance2);
});

bench("RuntimeCode.equals - different - voltaire", () => {
	RuntimeCode.equals(minimalInstance, simpleInstance);
});

bench("RuntimeCode.equals - large same - voltaire", () => {
	RuntimeCode.equals(largeInstance, largeInstance);
});

await run();

// ============================================================================
// Round-trip operations
// ============================================================================

bench("roundtrip (from+toHex) - minimal - voltaire", () => {
	const rc = RuntimeCode.from(minimalCode);
	RuntimeCode.toHex(rc);
});

bench("roundtrip (from+toHex) - simple - voltaire", () => {
	const rc = RuntimeCode.from(simpleCode);
	RuntimeCode.toHex(rc);
});

bench("roundtrip (from+toHex) - medium - voltaire", () => {
	const rc = RuntimeCode.from(mediumCode);
	RuntimeCode.toHex(rc);
});

bench("roundtrip (from+toHex) - large - voltaire", () => {
	const rc = RuntimeCode.from(largeCode);
	RuntimeCode.toHex(rc);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const codes = [minimalCode, simpleCode, mediumCode];

bench("batch from(hex) - 3 codes - voltaire", () => {
	for (const code of codes) {
		RuntimeCode.from(code);
	}
});

bench("batch toHex - 3 codes - voltaire", () => {
	for (const inst of [minimalInstance, simpleInstance, mediumInstance]) {
		RuntimeCode.toHex(inst);
	}
});

await run();
