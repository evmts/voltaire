/**
 * Benchmark: Voltaire TS vs WASM vs viem AccessList implementations
 * Compares performance of AccessList operations across different backends
 */

import { bench, run } from "mitata";
import { serializeAccessList } from "viem";
import * as loader from "../../wasm-loader/loader.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import * as Hex from "../Hex/index.js";
import {
	gasCostWasm,
	gasSavingsWasm,
	includesAddressWasm,
	includesStorageKeyWasm,
} from "./AccessList.wasm.js";
import type { BrandedAccessList, Item } from "./AccessListType.js";
import { assertValid } from "./assertValid.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { gasCost } from "./gasCost.js";
import { gasSavings } from "./gasSavings.js";
import { includesAddress } from "./includesAddress.js";
import { includesStorageKey } from "./includesStorageKey.js";
import { toBytes } from "./toBytes.js";

// Initialize WASM
await loader.loadWasm(
	new URL("../../wasm-loader/primitives.wasm", import.meta.url),
);

// ============================================================================
// Test Data - Realistic EIP-2930 Access Lists
// ============================================================================

// Helper to create test addresses
function createAddress(byte: number): BrandedAddress {
	const addr = new Uint8Array(20);
	addr.fill(byte);
	return addr as BrandedAddress;
}

// Helper to create test storage keys
function createStorageKey(byte: number): HashType {
	const key = new Uint8Array(32);
	key.fill(byte);
	return key as HashType;
}

// Real-world-like addresses
const uniswapRouter = createAddress(0x7a);
const weth = createAddress(0xc0);
const usdc = createAddress(0xa0);
const uniswapPool = createAddress(0x88);

// Common storage slots
const slot0 = createStorageKey(0x00);
const slot1 = createStorageKey(0x01);
const balanceSlot = createStorageKey(0x02);
const allowanceSlot = createStorageKey(0x03);
const sqrtPriceSlot = createStorageKey(0x04);
const liquiditySlot = createStorageKey(0x05);

// Small access list (typical simple swap)
const smallListArray: Item[] = [
	{ address: weth, storageKeys: [balanceSlot] },
	{ address: usdc, storageKeys: [balanceSlot, allowanceSlot] },
];
const smallList = from(smallListArray);

// Medium access list (multi-hop swap)
const mediumListArray: Item[] = [
	{ address: uniswapRouter, storageKeys: [] },
	{ address: weth, storageKeys: [balanceSlot, allowanceSlot] },
	{ address: usdc, storageKeys: [balanceSlot, allowanceSlot] },
	{
		address: uniswapPool,
		storageKeys: [slot0, slot1, sqrtPriceSlot, liquiditySlot],
	},
	{ address: createAddress(0x11), storageKeys: [balanceSlot] },
	{ address: createAddress(0x22), storageKeys: [balanceSlot, allowanceSlot] },
];
const mediumList = from(mediumListArray);

// Large access list (complex DeFi operation)
const largeListArray: Item[] = [];
for (let i = 0; i < 20; i++) {
	const keys: HashType[] = [];
	for (let j = 0; j < 5; j++) {
		keys.push(createStorageKey(i * 10 + j));
	}
	largeListArray.push({
		address: createAddress(i + 0x10),
		storageKeys: keys,
	});
}
const largeList = from(largeListArray);

// Pre-encode for fromBytes benchmarks
const smallListBytes = toBytes(smallList);
const mediumListBytes = toBytes(mediumList);
const largeListBytes = toBytes(largeList);

// Viem format (hex strings)
function toViemAccessList(
	list: BrandedAccessList,
): Array<{ address: `0x${string}`; storageKeys: `0x${string}`[] }> {
	return list.map((item) => ({
		address: Hex.fromBytes(item.address) as `0x${string}`,
		storageKeys: item.storageKeys.map((k) => Hex.fromBytes(k) as `0x${string}`),
	}));
}

const smallListViem = toViemAccessList(smallList);
const mediumListViem = toViemAccessList(mediumList);
const largeListViem = toViemAccessList(largeList);

// Note: viem's parseAccessList is not exported from public API, so we can't benchmark it directly

// ============================================================================
// from / parse Benchmarks
// ============================================================================

bench("from array - small - TS", () => {
	from(smallListArray);
});

bench("from array - medium - TS", () => {
	from(mediumListArray);
});

bench("from array - large - TS", () => {
	from(largeListArray);
});

await run();

bench("fromBytes - small - TS", () => {
	fromBytes(smallListBytes);
});

bench("fromBytes - medium - TS", () => {
	fromBytes(mediumListBytes);
});

bench("fromBytes - large - TS", () => {
	fromBytes(largeListBytes);
});

await run();

// ============================================================================
// encode / serialize Benchmarks
// ============================================================================

bench("toBytes - small - TS", () => {
	toBytes(smallList);
});

bench("toBytes - medium - TS", () => {
	toBytes(mediumList);
});

bench("toBytes - large - TS", () => {
	toBytes(largeList);
});

await run();

bench("serializeAccessList - small - viem", () => {
	serializeAccessList(smallListViem);
});

bench("serializeAccessList - medium - viem", () => {
	serializeAccessList(mediumListViem);
});

bench("serializeAccessList - large - viem", () => {
	serializeAccessList(largeListViem);
});

await run();

// ============================================================================
// validate Benchmarks
// ============================================================================

bench("assertValid - small - TS", () => {
	assertValid(smallList);
});

bench("assertValid - medium - TS", () => {
	assertValid(mediumList);
});

bench("assertValid - large - TS", () => {
	assertValid(largeList);
});

await run();

// ============================================================================
// gasCost Benchmarks (TS vs WASM)
// ============================================================================

bench("gasCost - small - TS", () => {
	gasCost(smallList);
});

bench("gasCost - small - WASM", () => {
	gasCostWasm(smallList);
});

await run();

bench("gasCost - medium - TS", () => {
	gasCost(mediumList);
});

bench("gasCost - medium - WASM", () => {
	gasCostWasm(mediumList);
});

await run();

bench("gasCost - large - TS", () => {
	gasCost(largeList);
});

bench("gasCost - large - WASM", () => {
	gasCostWasm(largeList);
});

await run();

// ============================================================================
// gasSavings Benchmarks (TS vs WASM)
// ============================================================================

bench("gasSavings - small - TS", () => {
	gasSavings(smallList);
});

bench("gasSavings - small - WASM", () => {
	gasSavingsWasm(smallList);
});

await run();

bench("gasSavings - medium - TS", () => {
	gasSavings(mediumList);
});

bench("gasSavings - medium - WASM", () => {
	gasSavingsWasm(mediumList);
});

await run();

bench("gasSavings - large - TS", () => {
	gasSavings(largeList);
});

bench("gasSavings - large - WASM", () => {
	gasSavingsWasm(largeList);
});

await run();

// ============================================================================
// includesAddress Benchmarks (TS vs WASM)
// ============================================================================

bench("includesAddress - found - TS", () => {
	includesAddress(mediumList, weth);
});

bench("includesAddress - found - WASM", () => {
	includesAddressWasm(mediumList, weth);
});

await run();

bench("includesAddress - not found - TS", () => {
	includesAddress(mediumList, createAddress(0xff));
});

bench("includesAddress - not found - WASM", () => {
	includesAddressWasm(mediumList, createAddress(0xff));
});

await run();

// ============================================================================
// includesStorageKey Benchmarks (TS vs WASM)
// ============================================================================

bench("includesStorageKey - found - TS", () => {
	includesStorageKey(mediumList, weth, balanceSlot);
});

bench("includesStorageKey - found - WASM", () => {
	includesStorageKeyWasm(mediumList, weth, balanceSlot);
});

await run();

bench("includesStorageKey - not found - TS", () => {
	includesStorageKey(mediumList, weth, createStorageKey(0xff));
});

bench("includesStorageKey - not found - WASM", () => {
	includesStorageKeyWasm(mediumList, weth, createStorageKey(0xff));
});

await run();
