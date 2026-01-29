/**
 * Signature Performance Benchmarks - SLICE 2
 *
 * Measures performance of Signature operations across:
 * - voltaire (default JS)
 * - voltaire-effect
 * - viem (reference)
 * - ethers (reference)
 */

import { bench, run } from "mitata";
import * as Signature from "./index.js";

// voltaire-effect
import * as SignatureEffect from "../../../voltaire-effect/src/primitives/Signature/index.js";
import * as Effect from "effect/Effect";

// viem comparison
import { parseSignature, serializeSignature } from "viem";

// ethers comparison
import { Signature as EthersSignature } from "ethers";

// =============================================================================
// Test Data
// =============================================================================

// secp256k1 test data
const secp256k1_r = new Uint8Array(32);
const secp256k1_s = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	secp256k1_r[i] = i + 1;
	secp256k1_s[i] = i + 33;
}
const secp256k1_v = 27;

// Non-canonical secp256k1 signature (s > n/2)
const secp256k1_s_noncanonical = new Uint8Array([
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b, 0xbf, 0xd2,
	0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
]);

// P256 test data
const p256_r = new Uint8Array(32);
const p256_s = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	p256_r[i] = i + 65;
	p256_s[i] = i + 97;
}

// Ed25519 test data
const ed25519_sig = new Uint8Array(64);
for (let i = 0; i < 64; i++) {
	ed25519_sig[i] = i + 129;
}

// Compact format (64 bytes)
const compactBytes = new Uint8Array(64);
for (let i = 0; i < 64; i++) {
	compactBytes[i] = i + 1;
}

// DER format test data (72 bytes - typical max size)
const derBytes = new Uint8Array([
	0x30,
	0x46, // SEQUENCE, length 70
	0x02,
	0x21, // INTEGER r, length 33
	0x00, // padding
	...secp256k1_r,
	0x02,
	0x21, // INTEGER s, length 33
	0x00, // padding
	...secp256k1_s,
]);

// Hex signature for viem/ethers comparison
const hexSignature =
	"0x" +
	Buffer.from(secp256k1_r).toString("hex") +
	Buffer.from(secp256k1_s).toString("hex") +
	"1b"; // v=27

// Pre-created signatures for conversion benchmarks
const sig_secp256k1 = Signature.fromSecp256k1(
	secp256k1_r,
	secp256k1_s,
	secp256k1_v,
);
const sig_secp256k1_nocanonical = Signature.fromSecp256k1(
	secp256k1_r,
	secp256k1_s_noncanonical,
	secp256k1_v,
);
const sig_p256 = Signature.fromP256(p256_r, p256_s);
const sig_ed25519 = Signature.fromEd25519(ed25519_sig);

// Multiple signatures for batch operations
const signatures_batch = Array.from({ length: 100 }, (_, i) => {
	const r = new Uint8Array(32).fill(i);
	const s = new Uint8Array(32).fill(i + 100);
	return Signature.fromSecp256k1(r, s, 27);
});

// =============================================================================
// Construction: fromSecp256k1
// =============================================================================

bench("Signature.fromSecp256k1 - voltaire", () => {
	Signature.fromSecp256k1(secp256k1_r, secp256k1_s, secp256k1_v);
});

bench("Signature.fromSecp256k1 - voltaire-effect", () => {
	SignatureEffect.fromSecp256k1(secp256k1_r, secp256k1_s, secp256k1_v);
});

await run();

// =============================================================================
// Construction: fromHex
// =============================================================================

bench("Signature.fromHex - voltaire", () => {
	Signature.fromHex(hexSignature);
});

bench("Signature.fromHex - voltaire-effect", () => {
	Effect.runSync(SignatureEffect.fromHex(hexSignature));
});

bench("parseSignature - viem", () => {
	parseSignature(hexSignature as `0x${string}`);
});

bench("Signature.from - ethers", () => {
	EthersSignature.from(hexSignature);
});

await run();

// =============================================================================
// Construction: fromP256
// =============================================================================

bench("Signature.fromP256 - voltaire", () => {
	Signature.fromP256(p256_r, p256_s);
});

bench("Signature.fromP256 - voltaire-effect", () => {
	SignatureEffect.fromP256(p256_r, p256_s);
});

await run();

// =============================================================================
// Construction: fromEd25519
// =============================================================================

bench("Signature.fromEd25519 - voltaire", () => {
	Signature.fromEd25519(ed25519_sig);
});

bench("Signature.fromEd25519 - voltaire-effect", () => {
	SignatureEffect.fromEd25519(ed25519_sig);
});

await run();

// =============================================================================
// Construction: fromCompact
// =============================================================================

bench("Signature.fromCompact - secp256k1 - voltaire", () => {
	Signature.fromCompact(compactBytes, "secp256k1");
});

bench("Signature.fromCompact - secp256k1 - voltaire-effect", () => {
	Effect.runSync(SignatureEffect.fromCompact(compactBytes, "secp256k1"));
});

await run();

// =============================================================================
// Construction: fromDER
// =============================================================================

bench("Signature.fromDER - secp256k1 - voltaire", () => {
	Signature.fromDER(derBytes, "secp256k1");
});

bench("Signature.fromDER - secp256k1 - voltaire-effect", () => {
	Effect.runSync(SignatureEffect.fromDER(derBytes, "secp256k1"));
});

await run();

// =============================================================================
// Conversion: toHex
// =============================================================================

bench("Signature.toHex - voltaire", () => {
	Signature.toHex(sig_secp256k1);
});

bench("Signature.toHex - voltaire-effect", () => {
	SignatureEffect.toHex(sig_secp256k1);
});

bench("serializeSignature - viem", () => {
	const parsed = parseSignature(hexSignature as `0x${string}`);
	serializeSignature(parsed);
});

bench("signature.serialized - ethers", () => {
	EthersSignature.from(hexSignature).serialized;
});

await run();

// =============================================================================
// Conversion: toBytes
// =============================================================================

bench("Signature.toBytes - secp256k1 - voltaire", () => {
	Signature.toBytes(sig_secp256k1);
});

bench("Signature.toBytes - secp256k1 - voltaire-effect", () => {
	SignatureEffect.toBytes(sig_secp256k1);
});

bench("Signature.toBytes - p256 - voltaire", () => {
	Signature.toBytes(sig_p256);
});

bench("Signature.toBytes - ed25519 - voltaire", () => {
	Signature.toBytes(sig_ed25519);
});

await run();

// =============================================================================
// Conversion: toCompact
// =============================================================================

bench("Signature.toCompact - secp256k1 - voltaire", () => {
	Signature.toCompact(sig_secp256k1);
});

bench("Signature.toCompact - secp256k1 - voltaire-effect", () => {
	SignatureEffect.toCompact(sig_secp256k1);
});

bench("Signature.toCompact - p256 - voltaire", () => {
	Signature.toCompact(sig_p256);
});

bench("Signature.toCompact - ed25519 - voltaire", () => {
	Signature.toCompact(sig_ed25519);
});

await run();

// =============================================================================
// Conversion: toDER
// =============================================================================

bench("Signature.toDER - secp256k1 - voltaire", () => {
	Signature.toDER(sig_secp256k1);
});

bench("Signature.toDER - secp256k1 - voltaire-effect", () => {
	SignatureEffect.toDER(sig_secp256k1);
});

bench("Signature.toDER - p256 - voltaire", () => {
	Signature.toDER(sig_p256);
});

await run();

// =============================================================================
// Accessors: getR, getS, getV
// =============================================================================

bench("Signature.getR - voltaire", () => {
	Signature.getR(sig_secp256k1);
});

bench("Signature.getR - voltaire-effect", () => {
	SignatureEffect.getR(sig_secp256k1);
});

await run();

bench("Signature.getS - voltaire", () => {
	Signature.getS(sig_secp256k1);
});

bench("Signature.getS - voltaire-effect", () => {
	SignatureEffect.getS(sig_secp256k1);
});

await run();

bench("Signature.getV - voltaire", () => {
	Signature.getV(sig_secp256k1);
});

bench("Signature.getV - voltaire-effect", () => {
	SignatureEffect.getV(sig_secp256k1);
});

await run();

// =============================================================================
// Algorithm detection
// =============================================================================

bench("Signature.getAlgorithm - secp256k1 - voltaire", () => {
	Signature.getAlgorithm(sig_secp256k1);
});

bench("Signature.getAlgorithm - secp256k1 - voltaire-effect", () => {
	SignatureEffect.getAlgorithm(sig_secp256k1);
});

bench("Signature.getAlgorithm - p256 - voltaire", () => {
	Signature.getAlgorithm(sig_p256);
});

bench("Signature.getAlgorithm - ed25519 - voltaire", () => {
	Signature.getAlgorithm(sig_ed25519);
});

await run();

// =============================================================================
// Canonicalization
// =============================================================================

bench("Signature.isCanonical - canonical - voltaire", () => {
	Signature.isCanonical(sig_secp256k1);
});

bench("Signature.isCanonical - canonical - voltaire-effect", () => {
	SignatureEffect.isCanonical(sig_secp256k1);
});

bench("Signature.isCanonical - non-canonical - voltaire", () => {
	Signature.isCanonical(sig_secp256k1_nocanonical);
});

bench("Signature.isCanonical - ed25519 - voltaire", () => {
	Signature.isCanonical(sig_ed25519);
});

await run();

bench("Signature.normalize - already canonical - voltaire", () => {
	Signature.normalize(sig_secp256k1);
});

bench("Signature.normalize - already canonical - voltaire-effect", () => {
	SignatureEffect.normalize(sig_secp256k1);
});

bench("Signature.normalize - non-canonical - voltaire", () => {
	Signature.normalize(sig_secp256k1_nocanonical);
});

bench("Signature.normalize - p256 - voltaire", () => {
	Signature.normalize(sig_p256);
});

bench("Signature.normalize - ed25519 (no-op) - voltaire", () => {
	Signature.normalize(sig_ed25519);
});

await run();

// =============================================================================
// Comparison
// =============================================================================

bench("Signature.equals - same - voltaire", () => {
	Signature.equals(sig_secp256k1, sig_secp256k1);
});

bench("Signature.equals - same - voltaire-effect", () => {
	SignatureEffect.equals(sig_secp256k1, sig_secp256k1);
});

bench("Signature.equals - different - voltaire", () => {
	Signature.equals(sig_secp256k1, sig_p256);
});

bench("Signature.equals - different algorithms - voltaire", () => {
	Signature.equals(sig_secp256k1, sig_ed25519);
});

await run();

// =============================================================================
// Type checking
// =============================================================================

bench("Signature.is - valid - voltaire", () => {
	Signature.is(sig_secp256k1);
});

bench("Signature.is - valid - voltaire-effect", () => {
	SignatureEffect.is(sig_secp256k1);
});

bench("Signature.is - invalid (bytes) - voltaire", () => {
	Signature.is(compactBytes);
});

bench("Signature.is - invalid (null) - voltaire", () => {
	Signature.is(null);
});

await run();

// =============================================================================
// Batch operations
// =============================================================================

bench("Batch normalize 10 signatures - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		// biome-ignore lint/style/noNonNullAssertion: benchmark array access
		Signature.normalize(signatures_batch[i]!);
	}
});

bench("Batch isCanonical 100 signatures - voltaire", () => {
	for (let i = 0; i < 100; i++) {
		// biome-ignore lint/style/noNonNullAssertion: benchmark array access
		Signature.isCanonical(signatures_batch[i]!);
	}
});

bench("Batch toCompact 100 signatures - voltaire", () => {
	for (let i = 0; i < 100; i++) {
		// biome-ignore lint/style/noNonNullAssertion: benchmark array access
		Signature.toCompact(signatures_batch[i]!);
	}
});

bench("Batch toDER 100 signatures - voltaire", () => {
	for (let i = 0; i < 100; i++) {
		// biome-ignore lint/style/noNonNullAssertion: benchmark array access
		Signature.toDER(signatures_batch[i]!);
	}
});

await run();

// =============================================================================
// Round-trip conversions
// =============================================================================

bench("roundtrip hex->sig->hex - voltaire", () => {
	const sig = Signature.fromHex(hexSignature);
	Signature.toHex(sig);
});

bench("roundtrip hex->sig->hex - viem", () => {
	const sig = parseSignature(hexSignature as `0x${string}`);
	serializeSignature(sig);
});

bench("roundtrip hex->sig->serialized - ethers", () => {
	EthersSignature.from(hexSignature).serialized;
});

await run();

bench(
	"secp256k1 full roundtrip (create -> normalize -> toDER) - voltaire",
	() => {
		const sig = Signature.fromSecp256k1(secp256k1_r, secp256k1_s, secp256k1_v);
		const normalized = Signature.normalize(sig);
		Signature.toDER(normalized);
	},
);

bench("p256 full roundtrip (create -> normalize -> toDER) - voltaire", () => {
	const sig = Signature.fromP256(p256_r, p256_s);
	const normalized = Signature.normalize(sig);
	Signature.toDER(normalized);
});

bench("ed25519 full roundtrip (create -> toCompact) - voltaire", () => {
	const sig = Signature.fromEd25519(ed25519_sig);
	Signature.toCompact(sig);
});

await run();
