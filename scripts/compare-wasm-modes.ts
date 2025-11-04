#!/usr/bin/env bun

/**
 * Compare ReleaseFast vs ReleaseSmall WASM performance
 */

import { loadWasm } from "../src/wasm-loader/loader.js";
import { Address as WasmAddress } from "../src/primitives/Address/Address.wasm.js";

const testAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const iterations = 100000;

console.log("=".repeat(80));
console.log("ReleaseFast vs ReleaseSmall WASM Performance Comparison");
console.log("=".repeat(80));
console.log("");

// Test with ReleaseFast
console.log("📊 Testing ReleaseFast WASM (2.3 MB)...");
await loadWasm(new URL("../wasm/primitives-fast.wasm", import.meta.url), true);

const start1 = performance.now();
for (let i = 0; i < iterations; i++) {
	WasmAddress.fromHex(testAddress);
}
const end1 = performance.now();
const fastFromHex = (end1 - start1) / iterations * 1000000;

const addr = WasmAddress.fromHex(testAddress);
const start2 = performance.now();
for (let i = 0; i < iterations; i++) {
	WasmAddress.toChecksummed(addr);
}
const end2 = performance.now();
const fastChecksum = (end2 - start2) / iterations * 1000000;

console.log(`  fromHex: ${fastFromHex.toFixed(2)} ns/iter`);
console.log(`  toChecksummed: ${fastChecksum.toFixed(2)} ns/iter`);
console.log("");

// Test with ReleaseSmall
console.log("📦 Testing ReleaseSmall WASM (286 KB)...");
await loadWasm(new URL("../wasm/primitives.wasm", import.meta.url), true);

const start3 = performance.now();
for (let i = 0; i < iterations; i++) {
	WasmAddress.fromHex(testAddress);
}
const end3 = performance.now();
const smallFromHex = (end3 - start3) / iterations * 1000000;

const addr2 = WasmAddress.fromHex(testAddress);
const start4 = performance.now();
for (let i = 0; i < iterations; i++) {
	WasmAddress.toChecksummed(addr2);
}
const end4 = performance.now();
const smallChecksum = (end4 - start4) / iterations * 1000000;

console.log(`  fromHex: ${smallFromHex.toFixed(2)} ns/iter`);
console.log(`  toChecksummed: ${smallChecksum.toFixed(2)} ns/iter`);
console.log("");

console.log("=".repeat(80));
console.log("📈 Performance Comparison");
console.log("=".repeat(80));
console.log("");

const fromHexDiff = ((fastFromHex - smallFromHex) / smallFromHex * 100);
const checksumDiff = ((fastChecksum - smallChecksum) / smallChecksum * 100);

console.log(`fromHex:`);
console.log(`  ReleaseFast: ${fastFromHex.toFixed(2)} ns`);
console.log(`  ReleaseSmall: ${smallFromHex.toFixed(2)} ns`);
console.log(`  Difference: ${fromHexDiff >= 0 ? '+' : ''}${fromHexDiff.toFixed(1)}%`);
console.log("");

console.log(`toChecksummed:`);
console.log(`  ReleaseFast: ${fastChecksum.toFixed(2)} ns`);
console.log(`  ReleaseSmall: ${smallChecksum.toFixed(2)} ns`);
console.log(`  Difference: ${checksumDiff >= 0 ? '+' : ''}${checksumDiff.toFixed(1)}%`);
console.log("");

console.log("=".repeat(80));
console.log("💡 Verdict");
console.log("=".repeat(80));
console.log("");
console.log(`Bundle Size: ReleaseFast is 8.3x larger (+2.1 MB)`);
console.log(`Performance: ReleaseFast is ~${Math.abs(fromHexDiff).toFixed(0)}% different`);
console.log("");

if (Math.abs(fromHexDiff) < 10 && Math.abs(checksumDiff) < 10) {
	console.log("✅ Recommendation: Use ReleaseSmall (286 KB)");
	console.log("   - Performance difference is negligible (< 10%)");
	console.log("   - 8x smaller bundle size");
	console.log("   - Perfect for production");
} else if (fromHexDiff < -10 || checksumDiff < -10) {
	console.log("⚡ Recommendation: ReleaseFast shows measurable gains");
	console.log(`   - ${Math.abs(fromHexDiff).toFixed(0)}% faster on average`);
	console.log("   - But 8x larger bundle");
	console.log("   - Consider use case: benchmark vs production");
} else {
	console.log("⚠️  Recommendation: ReleaseSmall is actually faster!");
	console.log("   - Smaller code may have better cache locality");
	console.log("   - No reason to use ReleaseFast");
}

console.log("");
