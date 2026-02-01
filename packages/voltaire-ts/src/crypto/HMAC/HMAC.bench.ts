/**
 * Benchmark: HMAC-SHA256/HMAC-SHA512 implementations
 * Compares performance of HMAC operations
 */

import { hmac } from "@noble/hashes/hmac.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { bench, run } from "mitata";
import { HMAC } from "./index.js";

// Test data
const shortKey = new Uint8Array(16).fill(0x0b);
const longKey = new Uint8Array(64).fill(0x0b);
const shortMessage = new Uint8Array(32).fill(0x61);
const mediumMessage = new Uint8Array(256).fill(0x62);
const largeMessage = new Uint8Array(1024).fill(0x63);

// ============================================================================
// HMAC-SHA256 Benchmarks
// ============================================================================

bench("sha256 - short key, short msg - Voltaire", () => {
	HMAC.sha256(shortKey, shortMessage);
});

bench("sha256 - short key, short msg - Noble", () => {
	hmac(sha256, shortKey, shortMessage);
});

await run();

bench("sha256 - short key, medium msg - Voltaire", () => {
	HMAC.sha256(shortKey, mediumMessage);
});

bench("sha256 - short key, medium msg - Noble", () => {
	hmac(sha256, shortKey, mediumMessage);
});

await run();

bench("sha256 - short key, large msg - Voltaire", () => {
	HMAC.sha256(shortKey, largeMessage);
});

bench("sha256 - short key, large msg - Noble", () => {
	hmac(sha256, shortKey, largeMessage);
});

await run();

bench("sha256 - long key, short msg - Voltaire", () => {
	HMAC.sha256(longKey, shortMessage);
});

bench("sha256 - long key, short msg - Noble", () => {
	hmac(sha256, longKey, shortMessage);
});

await run();

// ============================================================================
// HMAC-SHA512 Benchmarks
// ============================================================================

bench("sha512 - short key, short msg - Voltaire", () => {
	HMAC.sha512(shortKey, shortMessage);
});

bench("sha512 - short key, short msg - Noble", () => {
	hmac(sha512, shortKey, shortMessage);
});

await run();

bench("sha512 - short key, medium msg - Voltaire", () => {
	HMAC.sha512(shortKey, mediumMessage);
});

bench("sha512 - short key, medium msg - Noble", () => {
	hmac(sha512, shortKey, mediumMessage);
});

await run();

bench("sha512 - short key, large msg - Voltaire", () => {
	HMAC.sha512(shortKey, largeMessage);
});

bench("sha512 - short key, large msg - Noble", () => {
	hmac(sha512, shortKey, largeMessage);
});

await run();

bench("sha512 - long key, short msg - Voltaire", () => {
	HMAC.sha512(longKey, shortMessage);
});

bench("sha512 - long key, short msg - Noble", () => {
	hmac(sha512, longKey, shortMessage);
});

await run();
