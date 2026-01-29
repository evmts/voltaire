/**
 * PublicKey Performance Benchmarks - SLICE 2
 *
 * Benchmarks for public key operations:
 * - voltaire (default JS)
 * - viem (reference)
 */

import { bench, run } from "mitata";

// viem comparison
import { publicKeyToAddress } from "viem/utils";

// Use dist build to avoid source module issues
import * as PublicKey from "../../../dist/primitives/PublicKey/index.js";
import * as PrivateKey from "../../../dist/primitives/PrivateKey/index.js";

// ============================================================================
// Test Data
// ============================================================================

// Standard test private key for deriving public key
const TEST_PRIVATE_KEY =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const TEST_PRIVATE_KEY_BYTES = new Uint8Array([
	0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4, 0xd2,
	0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc, 0xae, 0x78,
	0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
]);

// Pre-derived uncompressed public key (64 bytes, no 0x04 prefix stored)
const TEST_PUBLIC_KEY_HEX =
	"0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5";

// Compressed public key (33 bytes with 02/03 prefix)
const TEST_PUBLIC_KEY_COMPRESSED = new Uint8Array([
	0x02, // even y prefix
	0x83,
	0x18,
	0x53,
	0x5b,
	0x54,
	0x10,
	0x5d,
	0x4a,
	0x7a,
	0xae,
	0x60,
	0xc0,
	0x8f,
	0xc4,
	0x5f,
	0x96,
	0x87,
	0x18,
	0x1b,
	0x4f,
	0xdf,
	0xc6,
	0x25,
	0xbd,
	0x1a,
	0x75,
	0x3f,
	0xa7,
	0x39,
	0x7f,
	0xed,
	0x75,
]);

// Uncompressed public key bytes (64 bytes)
const TEST_PUBLIC_KEY_BYTES = new Uint8Array([
	0x83, 0x18, 0x53, 0x5b, 0x54, 0x10, 0x5d, 0x4a, 0x7a, 0xae, 0x60, 0xc0, 0x8f,
	0xc4, 0x5f, 0x96, 0x87, 0x18, 0x1b, 0x4f, 0xdf, 0xc6, 0x25, 0xbd, 0x1a, 0x75,
	0x3f, 0xa7, 0x39, 0x7f, 0xed, 0x75, 0x35, 0x47, 0xf1, 0x1c, 0xa8, 0x69, 0x66,
	0x46, 0xf2, 0xf3, 0xac, 0xb0, 0x8e, 0x31, 0x01, 0x6a, 0xfa, 0xc2, 0x3e, 0x63,
	0x0c, 0x5d, 0x11, 0xf5, 0x9f, 0x61, 0xfe, 0xf5, 0x7b, 0x0d, 0x2a, 0xa5,
]);

// Pre-created instances
const voltairePublicKey = PublicKey.from(TEST_PUBLIC_KEY_HEX);

// ============================================================================
// Construction: from (hex string)
// ============================================================================

bench("PublicKey.from(hex) - voltaire", () => {
	PublicKey.from(TEST_PUBLIC_KEY_HEX);
});

await run();

// ============================================================================
// Construction: fromPrivateKey (takes bytes)
// ============================================================================

bench("PublicKey.fromPrivateKey - voltaire", () => {
	PublicKey.fromPrivateKey(TEST_PRIVATE_KEY_BYTES);
});

await run();

// ============================================================================
// Conversion: toHex
// ============================================================================

bench("PublicKey.toHex - voltaire", () => {
	PublicKey.toHex(TEST_PUBLIC_KEY_HEX);
});

await run();

// ============================================================================
// Conversion: toAddress
// ============================================================================

bench("PublicKey.toAddress - voltaire", () => {
	PublicKey.toAddress(TEST_PUBLIC_KEY_HEX);
});

// viem's publicKeyToAddress expects 0x04 prefixed key
const viemPubKey = ("0x04" + TEST_PUBLIC_KEY_HEX.slice(2)) as `0x${string}`;

bench("publicKeyToAddress - viem", () => {
	publicKeyToAddress(viemPubKey);
});

await run();

// ============================================================================
// Compression: compress
// ============================================================================

bench("PublicKey.compress - voltaire", () => {
	PublicKey.compress(TEST_PUBLIC_KEY_BYTES);
});

await run();

// ============================================================================
// Decompression: decompress
// ============================================================================

bench("PublicKey.decompress - voltaire", () => {
	PublicKey.decompress(TEST_PUBLIC_KEY_COMPRESSED);
});

await run();

// ============================================================================
// Compression check: isCompressed
// ============================================================================

bench("PublicKey.isCompressed - uncompressed - voltaire", () => {
	PublicKey.isCompressed(TEST_PUBLIC_KEY_BYTES);
});

bench("PublicKey.isCompressed - compressed - voltaire", () => {
	PublicKey.isCompressed(TEST_PUBLIC_KEY_COMPRESSED);
});

await run();

// ============================================================================
// Full derivation: privateKey -> publicKey -> address
// ============================================================================

bench("full derivation (privkey->pubkey->address) - voltaire", () => {
	const pubkey = PublicKey.fromPrivateKey(TEST_PRIVATE_KEY_BYTES);
	// pubkey is already bytes, toAddress wrapper expects string/bytes
	PublicKey.toAddress(pubkey);
});

await run();

// ============================================================================
// Round-trip: compress -> decompress
// ============================================================================

bench("roundtrip compress->decompress - voltaire", () => {
	const compressed = PublicKey.compress(TEST_PUBLIC_KEY_BYTES);
	PublicKey.decompress(compressed);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const testPrivateKeyBytes = [
	new Uint8Array([
		0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4,
		0xd2, 0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc,
		0xae, 0x78, 0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
	]),
	new Uint8Array([
		0x59, 0xc6, 0x99, 0x5e, 0x99, 0x8f, 0x97, 0xa5, 0xa0, 0x04, 0x49, 0x66,
		0xf0, 0x94, 0x53, 0x89, 0xdc, 0x9e, 0x86, 0xda, 0xe8, 0x8c, 0x7a, 0x84,
		0x12, 0xf4, 0x60, 0x3b, 0x6b, 0x78, 0x69, 0x0d,
	]),
	new Uint8Array([
		0x5d, 0xe4, 0x11, 0x1a, 0xfa, 0x1a, 0x4b, 0x94, 0x90, 0x8f, 0x83, 0x10,
		0x3e, 0xb1, 0xf1, 0x70, 0x63, 0x67, 0xc2, 0xe6, 0x8c, 0xa8, 0x70, 0xfc,
		0x3f, 0xb9, 0xa8, 0x04, 0xcd, 0xab, 0x36, 0x5a,
	]),
	new Uint8Array([
		0x7c, 0x85, 0x21, 0x18, 0x29, 0x4e, 0x51, 0xe6, 0x53, 0x71, 0x2a, 0x81,
		0xe0, 0x58, 0x00, 0xf4, 0x19, 0x14, 0x17, 0x51, 0xbe, 0x58, 0xf6, 0x05,
		0xc3, 0x71, 0xe1, 0x51, 0x41, 0xb0, 0x07, 0xa6,
	]),
	new Uint8Array([
		0x47, 0xe1, 0x79, 0xec, 0x19, 0x74, 0x88, 0x59, 0x3b, 0x18, 0x7f, 0x80,
		0xa0, 0x0e, 0xb0, 0xda, 0x91, 0xf1, 0xb9, 0xd0, 0xb1, 0x3f, 0x87, 0x33,
		0x63, 0x9f, 0x19, 0xc3, 0x0a, 0x34, 0x92, 0x6a,
	]),
];

bench("Batch fromPrivateKey (5 keys) - voltaire", () => {
	for (const keyBytes of testPrivateKeyBytes) {
		PublicKey.fromPrivateKey(keyBytes);
	}
});

await run();

bench("Batch toAddress (5 pubkeys) - voltaire", () => {
	for (const keyBytes of testPrivateKeyBytes) {
		const pubkey = PublicKey.fromPrivateKey(keyBytes);
		PublicKey.toAddress(pubkey);
	}
});

await run();
