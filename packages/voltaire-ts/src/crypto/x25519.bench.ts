/**
 * Benchmark: X25519 TypeScript vs WASM vs Noble implementations
 * Compares performance of X25519 key exchange operations
 */

import { x25519 } from "@noble/curves/ed25519.js";
import { bench, run } from "mitata";
import { loadWasm } from "../wasm-loader/loader.js";
import { X25519 } from "./X25519/index.js";
import { X25519Wasm } from "./x25519.wasm.js";

// Initialize WASM
await loadWasm(new URL("../wasm-loader/primitives.wasm", import.meta.url));

// Fixed test data (32-byte secret keys)
const secretKey1 = new Uint8Array([
	0x77, 0x07, 0x6d, 0x0a, 0x73, 0x18, 0xa5, 0x7d, 0x3c, 0x16, 0xc1, 0x72, 0x51,
	0xb2, 0x66, 0x45, 0xdf, 0x4c, 0x2f, 0x87, 0xeb, 0xc0, 0x99, 0x2a, 0xb1, 0x77,
	0xfb, 0xa5, 0x1d, 0xb9, 0x2c, 0x2a,
]);

const secretKey2 = new Uint8Array([
	0x5d, 0xab, 0x08, 0x7e, 0x62, 0x4a, 0x8a, 0x4b, 0x79, 0xe1, 0x7f, 0x8b, 0x83,
	0x80, 0x0e, 0xe6, 0x6f, 0x3b, 0xb1, 0x29, 0x26, 0x18, 0xb6, 0xfd, 0x1c, 0x2f,
	0x8b, 0x27, 0xff, 0x88, 0xe0, 0xeb,
]);

// Derive public keys for shared secret tests
const _publicKey1_ts = X25519.derivePublicKey(secretKey1);
const publicKey2_ts = X25519.derivePublicKey(secretKey2);

const _publicKey1_wasm = X25519Wasm.derivePublicKey(secretKey1);
const publicKey2_wasm = X25519Wasm.derivePublicKey(secretKey2);

const _publicKey1_noble = x25519.getPublicKey(secretKey1);
const publicKey2_noble = x25519.getPublicKey(secretKey2);

// ============================================================================
// getPublicKey / derivePublicKey Benchmarks
// ============================================================================

bench("getPublicKey - TypeScript", () => {
	X25519.derivePublicKey(secretKey1);
});

bench("getPublicKey - WASM", () => {
	X25519Wasm.derivePublicKey(secretKey1);
});

bench("getPublicKey - Noble", () => {
	x25519.getPublicKey(secretKey1);
});

await run();

// ============================================================================
// sharedSecret / scalarmult Benchmarks
// ============================================================================

bench("sharedSecret - TypeScript", () => {
	X25519.scalarmult(secretKey1, publicKey2_ts);
});

bench("sharedSecret - WASM", () => {
	X25519Wasm.scalarmult(secretKey1, publicKey2_wasm);
});

bench("sharedSecret - Noble", () => {
	x25519.getSharedSecret(secretKey1, publicKey2_noble);
});

await run();
