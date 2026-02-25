/**
 * Benchmark: ERC-1167/ERC-3448 Proxy operations
 * Tests minimal proxy bytecode generation and detection
 */

import { bench, run } from "mitata";
import * as ProxyModule from "./index.js";

// Test data - implementation address
const implementationAddress = new Uint8Array([
	0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3, 0xb8, 0x44,
	0xbc, 0x9e, 0x75, 0x95, 0xf0, 0xbe, 0xb0,
]);

// Pre-generate proxy bytecode for detection benchmarks
const erc1167Bytecode = ProxyModule.generateErc1167(implementationAddress);
const erc3448Bytecode = ProxyModule.generateErc3448(
	implementationAddress,
	new Uint8Array([1, 2, 3, 4]),
);

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

bench("ProxyModule.generateErc1167 - voltaire", () => {
	ProxyModule.generateErc1167(implementationAddress);
});

await run();

// ============================================================================
// generateErc3448 (metaproxy with metadata)
// ============================================================================

bench("ProxyModule.generateErc3448 - short metadata - voltaire", () => {
	ProxyModule.generateErc3448(implementationAddress, shortMetadata);
});

bench("ProxyModule.generateErc3448 - long metadata - voltaire", () => {
	ProxyModule.generateErc3448(implementationAddress, longMetadata);
});

await run();

// ============================================================================
// isErc1167 (proxy detection)
// ============================================================================

bench("ProxyModule.isErc1167 - valid proxy - voltaire", () => {
	ProxyModule.isErc1167(erc1167Bytecode);
});

bench("ProxyModule.isErc1167 - invalid bytecode - voltaire", () => {
	ProxyModule.isErc1167(invalidBytecode);
});

await run();

// ============================================================================
// isErc3448 (metaproxy detection)
// ============================================================================

bench("ProxyModule.isErc3448 - valid metaproxy - voltaire", () => {
	ProxyModule.isErc3448(erc3448Bytecode);
});

bench("ProxyModule.isErc3448 - invalid bytecode - voltaire", () => {
	ProxyModule.isErc3448(invalidBytecode);
});

await run();

// ============================================================================
// parseErc1167 (extract implementation address)
// ============================================================================

bench("ProxyModule.parseErc1167 - voltaire", () => {
	ProxyModule.parseErc1167(erc1167Bytecode);
});

await run();

// ============================================================================
// parseErc3448 (extract implementation + metadata)
// ============================================================================

bench("ProxyModule.parseErc3448 - voltaire", () => {
	ProxyModule.parseErc3448(erc3448Bytecode);
});

await run();

// ============================================================================
// Full workflow: generate + detect + parse
// ============================================================================

bench("Proxy workflow - generate + isErc1167 + parse - voltaire", () => {
	const bytecode = ProxyModule.generateErc1167(implementationAddress);
	if (ProxyModule.isErc1167(bytecode)) {
		ProxyModule.parseErc1167(bytecode);
	}
});

await run();
