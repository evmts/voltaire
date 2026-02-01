/**
 * InitCode Benchmarks - mitata format
 * Contract deployment initialization code operations
 */

import { bench, run } from "mitata";
import * as InitCode from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Simple init code (minimal contract)
const simpleInitCode =
	"0x6080604052348015600f57600080fd5b50603580601d6000396000f3006080604052600080fd00";

// Medium init code (simple storage contract)
const mediumInitCode =
	"0x608060405234801561001057600080fd5b5060405161012038038061012083398181016040528101906100329190610054565b806000819055505061007d565b60008151905061004d81610066565b92915050565b60006020828403121561006557600080fd5b60006100738482850161003e565b91505092915050565b610094806100866000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d14604f575b600080fd5b603d606b565b60405160489190607d565b60405180910390f35b6069600480360381019060659190608a565b6074565b005b60008054905090565b8060008190555050565b6082818460b6565b92915050565b60006020828403121560a057600080fd5b600060ac8482850160bf565b91505092915050565b6000819050919050565b60008151905060c88160d5565b92915050565b60006020828403121560e357600080fd5b600060ef8482850160c1565b91505092915050565b6101038160b6565b811461010e57600080fd5b50565b6101188160b6565b811461012357600080fd5b5056fea264697066735822";

// Large init code (ERC20-like)
const largeInitCode = "0x" + "60806040".repeat(500); // ~4KB

// Init code with constructor args
const initCodeWithArgs =
	"0x608060405234801561001057600080fd5b50604051610120380380610120833981810160405281019061003291906100540000000000000000000000000000000000000000000000000000000000000064"; // 100 as arg

// Bytes versions
const simpleBytes = new Uint8Array([
	0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15, 0x60, 0x0f, 0x57, 0x60, 0x00,
	0x80, 0xfd, 0x5b, 0x50, 0x60, 0x35, 0x80, 0x60, 0x1d, 0x60, 0x00, 0x39, 0x60,
	0x00, 0xf3, 0x00, 0x60, 0x80, 0x60, 0x40, 0x52, 0x60, 0x00, 0x80, 0xfd, 0x00,
]);

// Pre-created instances
const simpleInstance = InitCode.from(simpleInitCode);
const mediumInstance = InitCode.from(mediumInitCode);
const largeInstance = InitCode.from(largeInitCode);

// ============================================================================
// InitCode.from - construction
// ============================================================================

bench("InitCode.from(hex) - simple - voltaire", () => {
	InitCode.from(simpleInitCode);
});

bench("InitCode.from(hex) - medium - voltaire", () => {
	InitCode.from(mediumInitCode);
});

bench("InitCode.from(hex) - large (4KB) - voltaire", () => {
	InitCode.from(largeInitCode);
});

await run();

// ============================================================================
// InitCode.fromHex
// ============================================================================

bench("InitCode.fromHex - simple - voltaire", () => {
	InitCode.fromHex(simpleInitCode);
});

bench("InitCode.fromHex - medium - voltaire", () => {
	InitCode.fromHex(mediumInitCode);
});

await run();

// ============================================================================
// InitCode.toHex
// ============================================================================

bench("InitCode.toHex - simple - voltaire", () => {
	InitCode.toHex(simpleInstance);
});

bench("InitCode.toHex - medium - voltaire", () => {
	InitCode.toHex(mediumInstance);
});

bench("InitCode.toHex - large - voltaire", () => {
	InitCode.toHex(largeInstance);
});

await run();

// ============================================================================
// InitCode.equals
// ============================================================================

const simpleInstance2 = InitCode.from(simpleInitCode);

bench("InitCode.equals - same - voltaire", () => {
	InitCode.equals(simpleInstance, simpleInstance2);
});

bench("InitCode.equals - different - voltaire", () => {
	InitCode.equals(simpleInstance, mediumInstance);
});

await run();

// ============================================================================
// InitCode.estimateGas
// ============================================================================

bench("InitCode.estimateGas - simple - voltaire", () => {
	InitCode.estimateGas(simpleInstance);
});

bench("InitCode.estimateGas - medium - voltaire", () => {
	InitCode.estimateGas(mediumInstance);
});

bench("InitCode.estimateGas - large - voltaire", () => {
	InitCode.estimateGas(largeInstance);
});

await run();

// ============================================================================
// InitCode.extractRuntime
// ============================================================================

// The runtime offset needs to be found in the bytecode
// For simple contracts, it's typically after the deployment logic
const runtimeOffset = 29; // Typical offset for simple contracts

bench("InitCode.extractRuntime - simple - voltaire", () => {
	try {
		InitCode.extractRuntime(simpleInstance, runtimeOffset);
	} catch {
		// May throw if offset is invalid - that's ok for benchmark
	}
});

await run();

// ============================================================================
// Round-trip operations
// ============================================================================

bench("roundtrip (from+toHex) - simple - voltaire", () => {
	const ic = InitCode.from(simpleInitCode);
	InitCode.toHex(ic);
});

bench("roundtrip (from+toHex) - medium - voltaire", () => {
	const ic = InitCode.from(mediumInitCode);
	InitCode.toHex(ic);
});

bench("roundtrip (from+toHex) - large - voltaire", () => {
	const ic = InitCode.from(largeInitCode);
	InitCode.toHex(ic);
});

await run();

// ============================================================================
// Full analysis workflow
// ============================================================================

bench("full analysis (from+estimateGas+toHex) - simple - voltaire", () => {
	const ic = InitCode.from(simpleInitCode);
	InitCode.estimateGas(ic);
	InitCode.toHex(ic);
});

bench("full analysis (from+estimateGas+toHex) - medium - voltaire", () => {
	const ic = InitCode.from(mediumInitCode);
	InitCode.estimateGas(ic);
	InitCode.toHex(ic);
});

await run();
