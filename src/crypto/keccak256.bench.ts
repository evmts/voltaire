/**
 * Benchmark: JS vs WASM vs ethers vs viem Keccak256 implementations
 * Compares performance of Keccak256 operations across different backends
 */

import { keccak256 as ethersKeccak256 } from "ethers";
import { bench, run } from "mitata";
import { keccak256 as viemKeccak256 } from "viem";
import { Keccak256 } from "./Keccak256/index.js";
import { Keccak256Wasm } from "./keccak256.wasm.js";

// Initialize WASM
await Keccak256Wasm.init();

// Test data
const emptyData = new Uint8Array(0);
const data32B = new Uint8Array(32).fill(1);
const data256B = new Uint8Array(256).fill(2);
const data1KB = new Uint8Array(1024).fill(3);
const data4KB = new Uint8Array(4096).fill(4);

const shortString = "hello";
const mediumString = "The quick brown fox jumps over the lazy dog";
const longString = "a".repeat(1000);

const shortHex = "0x1234";
const mediumHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

const functionSig = "transfer(address,uint256)";
const eventSig = "Transfer(address,address,uint256)";

bench("hash - empty - JS", () => {
	Keccak256.hash(emptyData);
});

bench("hash - empty - WASM", () => {
	Keccak256Wasm.hash(emptyData);
});

bench("hash - empty - ethers", () => {
	ethersKeccak256(emptyData);
});

bench("hash - empty - viem", () => {
	viemKeccak256(emptyData);
});

await run();

bench("hash - 32B - JS", () => {
	Keccak256.hash(data32B);
});

bench("hash - 32B - WASM", () => {
	Keccak256Wasm.hash(data32B);
});

bench("hash - 32B - ethers", () => {
	ethersKeccak256(data32B);
});

bench("hash - 32B - viem", () => {
	viemKeccak256(data32B);
});

await run();

bench("hash - 256B - JS", () => {
	Keccak256.hash(data256B);
});

bench("hash - 256B - WASM", () => {
	Keccak256Wasm.hash(data256B);
});

bench("hash - 256B - ethers", () => {
	ethersKeccak256(data256B);
});

bench("hash - 256B - viem", () => {
	viemKeccak256(data256B);
});

await run();

bench("hash - 1KB - JS", () => {
	Keccak256.hash(data1KB);
});

bench("hash - 1KB - WASM", () => {
	Keccak256Wasm.hash(data1KB);
});

bench("hash - 1KB - ethers", () => {
	ethersKeccak256(data1KB);
});

bench("hash - 1KB - viem", () => {
	viemKeccak256(data1KB);
});

await run();

bench("hash - 4KB - JS", () => {
	Keccak256.hash(data4KB);
});

bench("hash - 4KB - WASM", () => {
	Keccak256Wasm.hash(data4KB);
});

bench("hash - 4KB - ethers", () => {
	ethersKeccak256(data4KB);
});

bench("hash - 4KB - viem", () => {
	viemKeccak256(data4KB);
});

await run();

bench("hashString - short - JS", () => {
	Keccak256.hashString(shortString);
});

bench("hashString - short - WASM", () => {
	Keccak256Wasm.hashString(shortString);
});

bench("hashString - short - ethers", () => {
	ethersKeccak256(Buffer.from(shortString, "utf-8"));
});

bench("hashString - short - viem", () => {
	viemKeccak256(new TextEncoder().encode(shortString));
});

await run();

bench("hashString - medium - JS", () => {
	Keccak256.hashString(mediumString);
});

bench("hashString - medium - WASM", () => {
	Keccak256Wasm.hashString(mediumString);
});

bench("hashString - medium - ethers", () => {
	ethersKeccak256(Buffer.from(mediumString, "utf-8"));
});

bench("hashString - medium - viem", () => {
	viemKeccak256(new TextEncoder().encode(mediumString));
});

await run();

bench("hashString - long - JS", () => {
	Keccak256.hashString(longString);
});

bench("hashString - long - WASM", () => {
	Keccak256Wasm.hashString(longString);
});

bench("hashString - long - ethers", () => {
	ethersKeccak256(Buffer.from(longString, "utf-8"));
});

bench("hashString - long - viem", () => {
	viemKeccak256(new TextEncoder().encode(longString));
});

await run();

bench("hashHex - short - JS", () => {
	Keccak256.hashHex(shortHex);
});

bench("hashHex - short - WASM", () => {
	Keccak256Wasm.hashHex(shortHex);
});

bench("hashHex - short - ethers", () => {
	ethersKeccak256(shortHex);
});

bench("hashHex - short - viem", () => {
	viemKeccak256(shortHex);
});

await run();

bench("hashHex - medium - JS", () => {
	Keccak256.hashHex(mediumHex);
});

bench("hashHex - medium - WASM", () => {
	Keccak256Wasm.hashHex(mediumHex);
});

bench("hashHex - medium - ethers", () => {
	ethersKeccak256(mediumHex);
});

bench("hashHex - medium - viem", () => {
	viemKeccak256(mediumHex);
});

await run();

bench("selector - JS", () => {
	Keccak256.selector(functionSig);
});

bench("selector - WASM", () => {
	Keccak256Wasm.selector(functionSig);
});

bench("selector - ethers", () => {
	ethersKeccak256(Buffer.from(functionSig, "utf-8")).slice(0, 10);
});

bench("selector - viem", () => {
	viemKeccak256(new TextEncoder().encode(functionSig)).slice(0, 10);
});

await run();

bench("topic - JS", () => {
	Keccak256.topic(eventSig);
});

bench("topic - WASM", () => {
	Keccak256Wasm.topic(eventSig);
});

bench("topic - ethers", () => {
	ethersKeccak256(Buffer.from(eventSig, "utf-8"));
});

bench("topic - viem", () => {
	viemKeccak256(new TextEncoder().encode(eventSig));
});

await run();
