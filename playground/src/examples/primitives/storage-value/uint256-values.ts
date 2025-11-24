import * as StorageValue from "../../../primitives/StorageValue/index.js";

// Example: Working with uint256 values in storage

// Small numbers
const small = StorageValue.from(42n);
console.log("Small number (42):", StorageValue.toHex(small));
console.log("As bigint:", StorageValue.toUint256(small));

// Large numbers (typical token amounts with 18 decimals)
const oneEther = StorageValue.from(1_000_000_000_000_000_000n); // 1e18
console.log("\n1 ETH (in wei):", StorageValue.toHex(oneEther));
console.log("As bigint:", StorageValue.toUint256(oneEther));

const oneThousandTokens = StorageValue.from(1000n * 10n ** 18n);
console.log(
	"\n1000 tokens (18 decimals):",
	StorageValue.toHex(oneThousandTokens),
);
console.log("As bigint:", StorageValue.toUint256(oneThousandTokens));

// Powers of 2 (common in bit manipulation)
const power8 = StorageValue.from(2n ** 8n); // 256
const power16 = StorageValue.from(2n ** 16n); // 65536
const power128 = StorageValue.from(2n ** 128n);

console.log("\n2^8 (256):", StorageValue.toHex(power8));
console.log("2^16 (65536):", StorageValue.toHex(power16));
console.log("2^128:", StorageValue.toHex(power128));

// Maximum safe uint64
const maxUint64 = 2n ** 64n - 1n;
const uint64Val = StorageValue.from(maxUint64);
console.log("\nMax uint64:", StorageValue.toHex(uint64Val));
console.log("As bigint:", StorageValue.toUint256(uint64Val));

// Maximum safe uint128
const maxUint128 = 2n ** 128n - 1n;
const uint128Val = StorageValue.from(maxUint128);
console.log("\nMax uint128:", StorageValue.toHex(uint128Val));

// Arithmetic boundaries
const nearMax = 2n ** 256n - 100n;
const nearMaxVal = StorageValue.from(nearMax);
console.log("\nNear max (2^256 - 100):", StorageValue.toHex(nearMaxVal));

// Common hex patterns
const deadbeef = StorageValue.from(0xdeadbeefn);
const cafebabe = StorageValue.from(0xcafebabean);

console.log("\n0xdeadbeef:", StorageValue.toHex(deadbeef));
console.log("0xcafebabe:", StorageValue.toHex(cafebabe));
