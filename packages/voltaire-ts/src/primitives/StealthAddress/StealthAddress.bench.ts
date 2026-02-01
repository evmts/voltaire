/**
 * Benchmark: ERC-5564 Stealth Address operations
 * Tests stealth address utility functions (non-crypto parts)
 */

import { bench, run } from "mitata";
import { compressPublicKey } from "./compressPublicKey.js";
import { computeViewTag } from "./computeViewTag.js";
import { decompressPublicKey } from "./decompressPublicKey.js";
import { generateMetaAddress } from "./generateMetaAddress.js";
import { parseMetaAddress } from "./parseMetaAddress.js";
import type {
	SpendingPublicKey,
	ViewingPublicKey,
} from "./StealthAddressType.js";

// Test data - pre-computed keys (deterministic for benchmarking)
const uncompressedKey = new Uint8Array(64);
for (let i = 0; i < 64; i++) {
	uncompressedKey[i] = (i * 7 + 13) % 256;
}

const compressedKey = new Uint8Array(33);
compressedKey[0] = 0x02; // even y
for (let i = 1; i < 33; i++) {
	compressedKey[i] = (i * 7 + 13) % 256;
}

// Pre-generate spending and viewing keys
const spendingPubKey = compressPublicKey(uncompressedKey);
const viewingPubKey = new Uint8Array(33);
viewingPubKey[0] = 0x03; // odd y
for (let i = 1; i < 33; i++) {
	viewingPubKey[i] = (i * 11 + 17) % 256;
}

// Generate a meta-address for parsing benchmarks
const metaAddress = generateMetaAddress(
	spendingPubKey as SpendingPublicKey,
	viewingPubKey as ViewingPublicKey,
);

// Test hash for view tag computation
const testHash = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	testHash[i] = i;
}

// ============================================================================
// compressPublicKey
// ============================================================================

bench("StealthAddress.compressPublicKey - voltaire", () => {
	compressPublicKey(uncompressedKey);
});

await run();

// ============================================================================
// decompressPublicKey
// ============================================================================

bench("StealthAddress.decompressPublicKey - voltaire", () => {
	decompressPublicKey(compressedKey);
});

await run();

// ============================================================================
// generateMetaAddress
// ============================================================================

bench("StealthAddress.generateMetaAddress - voltaire", () => {
	generateMetaAddress(
		spendingPubKey as SpendingPublicKey,
		viewingPubKey as ViewingPublicKey,
	);
});

await run();

// ============================================================================
// parseMetaAddress
// ============================================================================

bench("StealthAddress.parseMetaAddress - voltaire", () => {
	parseMetaAddress(metaAddress);
});

await run();

// ============================================================================
// computeViewTag
// ============================================================================

bench("StealthAddress.computeViewTag - voltaire", () => {
	computeViewTag(testHash);
});

await run();

// ============================================================================
// Full utility workflow: compress + generate + parse
// ============================================================================

bench(
	"StealthAddress workflow - compress + generateMeta + parse - voltaire",
	() => {
		const spending = compressPublicKey(uncompressedKey);
		const meta = generateMetaAddress(
			spending as SpendingPublicKey,
			viewingPubKey as ViewingPublicKey,
		);
		parseMetaAddress(meta);
	},
);

await run();
