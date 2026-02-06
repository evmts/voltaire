/**
 * Benchmark: TS vs WASM vs Noble RIPEMD160 implementations
 * Compares performance of RIPEMD160 operations across different backends
 */

import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy.js";
import { bench, run } from "mitata";
import { Ripemd160 } from "./Ripemd160/index.js";
import { Ripemd160Wasm } from "./ripemd160.wasm.js";

// Initialize WASM
await Ripemd160Wasm.load();

// Test data
const emptyData = new Uint8Array(0);
const data32B = new Uint8Array(32).fill(1);
const data256B = new Uint8Array(256).fill(2);
const data1KB = new Uint8Array(1024).fill(3);

const shortString = "hello";
const mediumString = "The quick brown fox jumps over the lazy dog";

bench("hash - empty - TS", () => {
	Ripemd160.hash(emptyData);
});

bench("hash - empty - WASM", () => {
	Ripemd160Wasm.hash(emptyData);
});

bench("hash - empty - noble", () => {
	nobleRipemd160(emptyData);
});

await run();

bench("hash - 32B - TS", () => {
	Ripemd160.hash(data32B);
});

bench("hash - 32B - WASM", () => {
	Ripemd160Wasm.hash(data32B);
});

bench("hash - 32B - noble", () => {
	nobleRipemd160(data32B);
});

await run();

bench("hash - 256B - TS", () => {
	Ripemd160.hash(data256B);
});

bench("hash - 256B - WASM", () => {
	Ripemd160Wasm.hash(data256B);
});

bench("hash - 256B - noble", () => {
	nobleRipemd160(data256B);
});

await run();

bench("hash - 1KB - TS", () => {
	Ripemd160.hash(data1KB);
});

bench("hash - 1KB - WASM", () => {
	Ripemd160Wasm.hash(data1KB);
});

bench("hash - 1KB - noble", () => {
	nobleRipemd160(data1KB);
});

await run();

bench("hashString - short - TS", () => {
	Ripemd160.hashString(shortString);
});

bench("hashString - short - WASM", () => {
	Ripemd160Wasm.hashString(shortString);
});

bench("hashString - short - noble", () => {
	nobleRipemd160(new TextEncoder().encode(shortString));
});

await run();

bench("hashString - medium - TS", () => {
	Ripemd160.hashString(mediumString);
});

bench("hashString - medium - WASM", () => {
	Ripemd160Wasm.hashString(mediumString);
});

bench("hashString - medium - noble", () => {
	nobleRipemd160(new TextEncoder().encode(mediumString));
});

await run();
