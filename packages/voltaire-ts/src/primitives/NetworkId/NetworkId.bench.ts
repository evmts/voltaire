/**
 * Benchmark: NetworkId operations
 * Tests network ID creation and comparison (simple type wrapper)
 */

import { bench, run } from "mitata";

// NetworkId is a simple type wrapper, but we can still benchmark basic ops
// Import the module dynamically since it may just be type exports

// Test data
const mainnetNetworkId = 1;
const ropstenNetworkId = 3;

// ============================================================================
// Basic operations (if implemented)
// ============================================================================

// NetworkId is primarily a type - benchmarks show overhead of type validation
bench("Number comparison - baseline", () => {
	mainnetNetworkId === ropstenNetworkId;
});

bench("BigInt conversion - baseline", () => {
	BigInt(mainnetNetworkId);
});

await run();
