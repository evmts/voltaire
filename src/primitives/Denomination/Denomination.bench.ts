import { bench, run } from "mitata";
import * as Wei from "./Wei.js";
import * as Gwei from "./Gwei.js";
import * as Ether from "./Ether.js";

console.log("=".repeat(80));
console.log("Denomination Benchmark");
console.log("=".repeat(80));
console.log("");

// =============================================================================
// 1. Wei.from - Create Wei from various values
// =============================================================================

console.log("1. Wei.from - Create Wei from various values");
console.log("-".repeat(80));

bench("Wei.from - small (1 wei)", () => {
	Wei.from(1n);
});

bench("Wei.from - medium (1000 wei)", () => {
	Wei.from(1000n);
});

bench("Wei.from - large (1e18 wei)", () => {
	Wei.from(1_000_000_000_000_000_000n);
});

bench("Wei.from - max uint256", () => {
	Wei.from(2n ** 256n - 1n);
});

await run();
console.log("");

// =============================================================================
// 2. Wei.toGwei - Convert Wei to Gwei
// =============================================================================

console.log("2. Wei.toGwei - Convert Wei to Gwei");
console.log("-".repeat(80));

const weiSmall = Wei.from(1_000_000_000n);
const weiMedium = Wei.from(1_000_000_000_000n);
const weiLarge = Wei.from(1_000_000_000_000_000_000n);

bench("Wei.toGwei - small (1 Gwei)", () => {
	Wei.toGwei(weiSmall);
});

bench("Wei.toGwei - medium (1000 Gwei)", () => {
	Wei.toGwei(weiMedium);
});

bench("Wei.toGwei - large (1e9 Gwei)", () => {
	Wei.toGwei(weiLarge);
});

await run();
console.log("");

// =============================================================================
// 3. Wei.toEther - Convert Wei to Ether
// =============================================================================

console.log("3. Wei.toEther - Convert Wei to Ether");
console.log("-".repeat(80));

const wei1Ether = Wei.from(1_000_000_000_000_000_000n);
const wei1000Ether = Wei.from(1_000_000_000_000_000_000_000n);

bench("Wei.toEther - small (1 Ether)", () => {
	Wei.toEther(wei1Ether);
});

bench("Wei.toEther - medium (1000 Ether)", () => {
	Wei.toEther(wei1000Ether);
});

await run();
console.log("");

// =============================================================================
// 4. Gwei.from - Create Gwei from various values
// =============================================================================

console.log("4. Gwei.from - Create Gwei from various values");
console.log("-".repeat(80));

bench("Gwei.from - small (1 gwei)", () => {
	Gwei.from(1n);
});

bench("Gwei.from - medium (1000 gwei)", () => {
	Gwei.from(1000n);
});

bench("Gwei.from - large (1e9 gwei)", () => {
	Gwei.from(1_000_000_000n);
});

await run();
console.log("");

// =============================================================================
// 5. Gwei.toWei - Convert Gwei to Wei
// =============================================================================

console.log("5. Gwei.toWei - Convert Gwei to Wei");
console.log("-".repeat(80));

const gweiSmall = Gwei.from(1n);
const gweiMedium = Gwei.from(1000n);
const gweiLarge = Gwei.from(1_000_000_000n);

bench("Gwei.toWei - small (1 Gwei)", () => {
	Gwei.toWei(gweiSmall);
});

bench("Gwei.toWei - medium (1000 Gwei)", () => {
	Gwei.toWei(gweiMedium);
});

bench("Gwei.toWei - large (1e9 Gwei)", () => {
	Gwei.toWei(gweiLarge);
});

await run();
console.log("");

// =============================================================================
// 6. Gwei.toEther - Convert Gwei to Ether
// =============================================================================

console.log("6. Gwei.toEther - Convert Gwei to Ether");
console.log("-".repeat(80));

const gwei1Ether = Gwei.from(1_000_000_000n);
const gwei1000Ether = Gwei.from(1_000_000_000_000n);

bench("Gwei.toEther - small (1 Ether)", () => {
	Gwei.toEther(gwei1Ether);
});

bench("Gwei.toEther - medium (1000 Ether)", () => {
	Gwei.toEther(gwei1000Ether);
});

await run();
console.log("");

// =============================================================================
// 7. Ether.from - Create Ether from various values
// =============================================================================

console.log("7. Ether.from - Create Ether from various values");
console.log("-".repeat(80));

bench("Ether.from - small (1 ether)", () => {
	Ether.from(1n);
});

bench("Ether.from - medium (1000 ether)", () => {
	Ether.from(1000n);
});

bench("Ether.from - large (1e6 ether)", () => {
	Ether.from(1_000_000n);
});

await run();
console.log("");

// =============================================================================
// 8. Ether.toWei - Convert Ether to Wei
// =============================================================================

console.log("8. Ether.toWei - Convert Ether to Wei");
console.log("-".repeat(80));

const etherSmall = Ether.from(1n);
const etherMedium = Ether.from(1000n);
const etherLarge = Ether.from(1_000_000n);

bench("Ether.toWei - small (1 Ether)", () => {
	Ether.toWei(etherSmall);
});

bench("Ether.toWei - medium (1000 Ether)", () => {
	Ether.toWei(etherMedium);
});

bench("Ether.toWei - large (1e6 Ether)", () => {
	Ether.toWei(etherLarge);
});

await run();
console.log("");

// =============================================================================
// 9. Ether.toGwei - Convert Ether to Gwei
// =============================================================================

console.log("9. Ether.toGwei - Convert Ether to Gwei");
console.log("-".repeat(80));

bench("Ether.toGwei - small (1 Ether)", () => {
	Ether.toGwei(etherSmall);
});

bench("Ether.toGwei - medium (1000 Ether)", () => {
	Ether.toGwei(etherMedium);
});

bench("Ether.toGwei - large (1e6 Ether)", () => {
	Ether.toGwei(etherLarge);
});

await run();
console.log("");

// =============================================================================
// 10. Round-trip conversions
// =============================================================================

console.log("10. Round-trip conversions");
console.log("-".repeat(80));

const weiForRoundtrip = Wei.from(5_000_000_000_000_000_000n);

bench("Wei → Gwei → Wei", () => {
	const gwei = Wei.toGwei(weiForRoundtrip);
	Gwei.toWei(gwei);
});

bench("Wei → Ether → Wei", () => {
	const ether = Wei.toEther(weiForRoundtrip);
	Ether.toWei(ether);
});

bench("Gwei → Ether → Gwei", () => {
	const gwei = Gwei.from(2_000_000_000n);
	const ether = Gwei.toEther(gwei);
	Ether.toGwei(ether);
});

await run();
console.log("");

// =============================================================================
// 11. Batch operations - Convert 100 values
// =============================================================================

console.log("11. Batch operations - Convert 100 values");
console.log("-".repeat(80));

bench("Wei.toGwei - 100 conversions", () => {
	for (let i = 0; i < 100; i++) {
		const wei = Wei.from(BigInt(i) * 1_000_000_000n);
		Wei.toGwei(wei);
	}
});

bench("Gwei.toWei - 100 conversions", () => {
	for (let i = 0; i < 100; i++) {
		const gwei = Gwei.from(BigInt(i));
		Gwei.toWei(gwei);
	}
});

bench("Ether.toWei - 100 conversions", () => {
	for (let i = 0; i < 100; i++) {
		const ether = Ether.from(BigInt(i));
		Ether.toWei(ether);
	}
});

await run();
console.log("");

// =============================================================================
// 12. Edge cases - Zero values
// =============================================================================

console.log("12. Edge cases - Zero values");
console.log("-".repeat(80));

const weiZero = Wei.from(0n);
const gweiZero = Gwei.from(0n);
const etherZero = Ether.from(0n);

bench("Wei.from - zero", () => {
	Wei.from(0n);
});

bench("Wei.toGwei - zero", () => {
	Wei.toGwei(weiZero);
});

bench("Wei.toEther - zero", () => {
	Wei.toEther(weiZero);
});

bench("Gwei.toWei - zero", () => {
	Gwei.toWei(gweiZero);
});

bench("Ether.toWei - zero", () => {
	Ether.toWei(etherZero);
});

await run();
console.log("");

// =============================================================================
// 13. Edge cases - Max values
// =============================================================================

console.log("13. Edge cases - Max values");
console.log("-".repeat(80));

const weiMax = Wei.from(2n ** 256n - 1n);
const gweiMax = Gwei.from(2n ** 256n - 1n);
const etherMax = Ether.from(2n ** 200n);

bench("Wei.from - max uint256", () => {
	Wei.from(2n ** 256n - 1n);
});

bench("Wei.toGwei - max uint256", () => {
	Wei.toGwei(weiMax);
});

bench("Wei.toEther - max uint256", () => {
	Wei.toEther(weiMax);
});

bench("Gwei.toWei - large value", () => {
	Gwei.toWei(gweiMax);
});

bench("Ether.toWei - large value", () => {
	Ether.toWei(etherMax);
});

await run();
console.log("");

// =============================================================================
// 14. Realistic Ethereum values
// =============================================================================

console.log("14. Realistic Ethereum values");
console.log("-".repeat(80));

const gasPrice50Gwei = Gwei.from(50n);
const txValue01Ether = Wei.from(100_000_000_000_000_000n);
const balance15Ether = Wei.from(1_500_000_000_000_000_000n);

bench("Gas price - 50 Gwei to Wei", () => {
	Gwei.toWei(gasPrice50Gwei);
});

bench("TX value - 0.1 ETH operations", () => {
	Wei.toGwei(txValue01Ether);
});

bench("Account balance - 1.5 ETH to Gwei", () => {
	Wei.toGwei(balance15Ether);
});

await run();
console.log("");

console.log("=".repeat(80));
console.log("Denomination Benchmarks Complete");
console.log("=".repeat(80));
