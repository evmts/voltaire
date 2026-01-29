/**
 * Benchmark: Solidity Contract Metadata operations
 * Tests metadata encoding/decoding and bytecode extraction
 */

import { bench, run } from "mitata";
import * as Metadata from "./index.js";

// Test metadata object with hex-prefixed values (as expected by encoder)
const simpleMetadata = {
	ipfs: "0x" + "ab".repeat(34), // IPFS CID as hex
	solc: "0.8.20",
};

const complexMetadata = {
	ipfs: "0x" + "ab".repeat(34),
	solc: "0.8.20",
	experimental: true,
	bzzr1: "0x" + "cd".repeat(32),
};

// Pre-encode metadata for decode benchmarks
const encodedSimple = Metadata.encode(simpleMetadata);
const encodedComplex = Metadata.encode(complexMetadata);

// ============================================================================
// encode
// ============================================================================

bench("Metadata.encode - simple - voltaire", () => {
	Metadata.encode(simpleMetadata);
});

bench("Metadata.encode - complex - voltaire", () => {
	Metadata.encode(complexMetadata);
});

await run();

// ============================================================================
// decode
// ============================================================================

bench("Metadata.decode - simple - voltaire", () => {
	Metadata.decode(encodedSimple);
});

bench("Metadata.decode - complex - voltaire", () => {
	Metadata.decode(encodedComplex);
});

await run();

// ============================================================================
// from (parse metadata object)
// ============================================================================

bench("Metadata.from - object - voltaire", () => {
	Metadata.from(simpleMetadata);
});

await run();

// ============================================================================
// Full workflow: encode + decode roundtrip
// ============================================================================

bench("Metadata workflow - encode + decode - voltaire", () => {
	const encoded = Metadata.encode(simpleMetadata);
	Metadata.decode(encoded);
});

await run();
