import * as StorageValue from "../../../primitives/StorageValue/index.js";

// Example: Working with uint256 values in storage

// Small numbers
const small = StorageValue.from(42n);

// Large numbers (typical token amounts with 18 decimals)
const oneEther = StorageValue.from(1_000_000_000_000_000_000n); // 1e18

const oneThousandTokens = StorageValue.from(1000n * 10n ** 18n);

// Powers of 2 (common in bit manipulation)
const power8 = StorageValue.from(2n ** 8n); // 256
const power16 = StorageValue.from(2n ** 16n); // 65536
const power128 = StorageValue.from(2n ** 128n);

// Maximum safe uint64
const maxUint64 = 2n ** 64n - 1n;
const uint64Val = StorageValue.from(maxUint64);

// Maximum safe uint128
const maxUint128 = 2n ** 128n - 1n;
const uint128Val = StorageValue.from(maxUint128);

// Arithmetic boundaries
const nearMax = 2n ** 256n - 100n;
const nearMaxVal = StorageValue.from(nearMax);

// Common hex patterns
const deadbeef = StorageValue.from(0xdeadbeefn);
const cafebabe = StorageValue.from(0xcafebabean);
