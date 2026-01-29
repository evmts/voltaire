/**
 * Benchmark: JS vs WASM vs ethers vs viem SHA256 implementations
 * Compares performance of SHA256 operations across different backends
 */

import { sha256 as ethersSha256 } from "ethers";
import { bench, run } from "mitata";
import { sha256 as viemSha256 } from "viem";
import { loadWasm } from "../wasm-loader/loader.js";
import { SHA256Hash } from "./SHA256/index.js";
import { Sha256Wasm } from "./sha256.wasm.js";

// Initialize WASM
await loadWasm(new URL("../wasm-loader/primitives.wasm", import.meta.url));

// Test data
const emptyData = new Uint8Array(0);
const data32B = new Uint8Array(32).fill(1);
const data256B = new Uint8Array(256).fill(2);
const data1KB = new Uint8Array(1024).fill(3);

bench("hash - empty - JS", () => {
	SHA256Hash.hash(emptyData);
});

bench("hash - empty - WASM", () => {
	Sha256Wasm.hash(emptyData);
});

bench("hash - empty - ethers", () => {
	ethersSha256(emptyData);
});

bench("hash - empty - viem", () => {
	viemSha256(emptyData);
});

await run();

bench("hash - 32B - JS", () => {
	SHA256Hash.hash(data32B);
});

bench("hash - 32B - WASM", () => {
	Sha256Wasm.hash(data32B);
});

bench("hash - 32B - ethers", () => {
	ethersSha256(data32B);
});

bench("hash - 32B - viem", () => {
	viemSha256(data32B);
});

await run();

bench("hash - 256B - JS", () => {
	SHA256Hash.hash(data256B);
});

bench("hash - 256B - WASM", () => {
	Sha256Wasm.hash(data256B);
});

bench("hash - 256B - ethers", () => {
	ethersSha256(data256B);
});

bench("hash - 256B - viem", () => {
	viemSha256(data256B);
});

await run();

bench("hash - 1KB - JS", () => {
	SHA256Hash.hash(data1KB);
});

bench("hash - 1KB - WASM", () => {
	Sha256Wasm.hash(data1KB);
});

bench("hash - 1KB - ethers", () => {
	ethersSha256(data1KB);
});

bench("hash - 1KB - viem", () => {
	viemSha256(data1KB);
});

await run();
