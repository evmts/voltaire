#!/usr/bin/env bun

/**
 * Compare ReleaseFast vs ReleaseSmall WASM performance
 */

import { Address as WasmAddress } from "../src/primitives/Address/index.js";
import { loadWasm } from "../src/wasm-loader/loader.js";

const testAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const iterations = 100000;
await loadWasm(new URL("../wasm/primitives-fast.wasm", import.meta.url), true);

const start1 = performance.now();
for (let i = 0; i < iterations; i++) {
	WasmAddress.fromHex(testAddress);
}
const end1 = performance.now();
const fastFromHex = ((end1 - start1) / iterations) * 1000000;

const addr = WasmAddress.fromHex(testAddress);
const start2 = performance.now();
for (let i = 0; i < iterations; i++) {
	WasmAddress.toChecksummed(addr);
}
const end2 = performance.now();
const fastChecksum = ((end2 - start2) / iterations) * 1000000;
await loadWasm(new URL("../wasm/primitives.wasm", import.meta.url), true);

const start3 = performance.now();
for (let i = 0; i < iterations; i++) {
	WasmAddress.fromHex(testAddress);
}
const end3 = performance.now();
const smallFromHex = ((end3 - start3) / iterations) * 1000000;

const addr2 = WasmAddress.fromHex(testAddress);
const start4 = performance.now();
for (let i = 0; i < iterations; i++) {
	WasmAddress.toChecksummed(addr2);
}
const end4 = performance.now();
const smallChecksum = ((end4 - start4) / iterations) * 1000000;

const fromHexDiff = ((fastFromHex - smallFromHex) / smallFromHex) * 100;
const checksumDiff = ((fastChecksum - smallChecksum) / smallChecksum) * 100;

if (Math.abs(fromHexDiff) < 10 && Math.abs(checksumDiff) < 10) {
} else if (fromHexDiff < -10 || checksumDiff < -10) {
} else {
}
