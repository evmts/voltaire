/**
 * Benchmark: ERC-1167/ERC-3448 Proxy operations
 * Tests minimal proxy bytecode generation and detection
 */

import { bench, run } from "mitata";
import * as Proxy from "./index.js";

// Test data - implementation address
const implementationAddress = new Uint8Array([
	0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25,
	0xa3, 0xb8, 0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf0, 0xbe, 0xb0,
]);

// Pre-generate proxy bytecode for detection benchmarks
const erc1167Bytecode = Proxy.generateErc1167(implementationAddress);
const erc3448Bytecode = Proxy.generateErc3448(implementationAddress, new Uint8Array([1, 2, 3, 4]));

// Invalid bytecode for negative tests
const invalidBytecode = new Uint8Array(45);
invalidBytecode.fill(0);

// Metadata for ERC-3448
const shortMetadata = new Uint8Array([1, 2, 3, 4]);
const longMetadata = new Uint8Array(100);
for (let i = 0; i < 100; i++) {
	longMetadata[i] = i % 256;
}

// ============================================================================
// generateErc1167 (minimal proxy creation)
// ============================================================================

bench("Proxy.generateErc1167 - voltaire", () => {
	Proxy.generateErc1167(implementationAddress);
});

await run();

// ============================================================================
// generateErc3448 (metaproxy with metadata)
// ============================================================================

bench("Proxy.generateErc3448 - short metadata - voltaire", () => {
	Proxy.generateErc3448(implementationAddress, shortMetadata);
});

bench("Proxy.generateErc3448 - long metadata - voltaire", () => {
	Proxy.generateErc3448(implementationAddress, longMetadata);
});

await run();

// ============================================================================
// isErc1167 (proxy detection)
// ============================================================================

bench("Proxy.isErc1167 - valid proxy - voltaire", () => {
	Proxy.isErc1167(erc1167Bytecode);
});

bench("Proxy.isErc1167 - invalid bytecode - voltaire", () => {
	Proxy.isErc1167(invalidBytecode);
});

await run();

// ============================================================================
// isErc3448 (metaproxy detection)
// ============================================================================

bench("Proxy.isErc3448 - valid metaproxy - voltaire", () => {
	Proxy.isErc3448(erc3448Bytecode);
});

bench("Proxy.isErc3448 - invalid bytecode - voltaire", () => {
	Proxy.isErc3448(invalidBytecode);
});

await run();

// ============================================================================
// parseErc1167 (extract implementation address)
// ============================================================================

bench("Proxy.parseErc1167 - voltaire", () => {
	Proxy.parseErc1167(erc1167Bytecode);
});

await run();

// ============================================================================
// parseErc3448 (extract implementation + metadata)
// ============================================================================

bench("Proxy.parseErc3448 - voltaire", () => {
	Proxy.parseErc3448(erc3448Bytecode);
});

await run();

// ============================================================================
// Full workflow: generate + detect + parse
// ============================================================================

bench("Proxy workflow - generate + isErc1167 + parse - voltaire", () => {
	const bytecode = Proxy.generateErc1167(implementationAddress);
	if (Proxy.isErc1167(bytecode)) {
		Proxy.parseErc1167(bytecode);
	}
});

await run();
