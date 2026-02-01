/**
 * Benchmark: TS vs WASM Authorization (EIP-7702) implementations
 * Compares performance of authorization operations across backends
 */

import { bench, run } from "mitata";
import * as loader from "../../wasm-loader/loader.js";
import type { AddressType } from "../Address/AddressType.js";
import {
	gasCostWasm,
	signingHashWasm,
	validateWasm,
} from "./Authorization.wasm.js";
import type { AuthorizationType } from "./AuthorizationType.js";
import * as Authorization from "./index.js";

// Initialize WASM
await loader.loadWasm(
	new URL("../../wasm-loader/primitives.wasm", import.meta.url),
);

// ============================================================================
// Test Data - Realistic EIP-7702 authorization data
// ============================================================================

function createAddress(byte: number): AddressType {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as AddressType;
}

function bigintToBytes32(n: bigint): Uint8Array {
	const bytes = new Uint8Array(32);
	let remaining = n;
	for (let i = 31; i >= 0 && remaining > 0n; i--) {
		bytes[i] = Number(remaining & 0xffn);
		remaining >>= 8n;
	}
	return bytes;
}

// Valid r and s within secp256k1 curve order
const _SECP256K1_N =
	0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const validR =
	0x8912b5c7c8d3b8a2f1e5d4c3b2a1908f7e6d5c4b3a29181706f5e4d3c2b1a09fn;
const validS =
	0x3456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012n;

// Single valid authorization
const delegateAddress = createAddress(0xaa);
const validAuth: AuthorizationType = {
	chainId: 1n,
	address: delegateAddress,
	nonce: 0n,
	yParity: 0,
	r: bigintToBytes32(validR),
	s: bigintToBytes32(validS),
};

// Unsigned authorization (for hash computation)
const unsignedAuth = {
	chainId: 1n,
	address: delegateAddress,
	nonce: 0n,
};

// Authorization lists of various sizes
const smallList: AuthorizationType[] = Array.from({ length: 2 }, (_, i) => ({
	chainId: 1n,
	address: createAddress(i + 1),
	nonce: BigInt(i),
	yParity: i % 2,
	r: bigintToBytes32(validR + BigInt(i)),
	s: bigintToBytes32(validS + BigInt(i)),
}));

const mediumList: AuthorizationType[] = Array.from({ length: 10 }, (_, i) => ({
	chainId: 1n,
	address: createAddress(i + 1),
	nonce: BigInt(i),
	yParity: i % 2,
	r: bigintToBytes32(validR + BigInt(i)),
	s: bigintToBytes32(validS + BigInt(i)),
}));

const largeList: AuthorizationType[] = Array.from({ length: 100 }, (_, i) => ({
	chainId: 1n,
	address: createAddress((i % 50) + 1),
	nonce: BigInt(i),
	yParity: i % 2,
	r: bigintToBytes32(validR + BigInt(i)),
	s: bigintToBytes32(validS + BigInt(i)),
}));

// ============================================================================
// Benchmarks
// ============================================================================

// Validation benchmarks
bench("validate - TS", () => {
	Authorization.validate(validAuth);
});

bench("validate - WASM", () => {
	validateWasm(validAuth);
});

await run();

// Hash computation benchmarks
bench("hash (signingHash) - TS", () => {
	Authorization.hash(unsignedAuth);
});

bench("hash (signingHash) - WASM", () => {
	signingHashWasm(
		unsignedAuth.chainId,
		unsignedAuth.address,
		unsignedAuth.nonce,
	);
});

await run();

// Gas cost calculation benchmarks - empty list
bench("calculateGasCost - empty - TS", () => {
	Authorization.calculateGasCost([], 0);
});

bench("calculateGasCost - empty - WASM", () => {
	gasCostWasm(0, 0);
});

await run();

// Gas cost calculation benchmarks - small list
bench("calculateGasCost - 2 auths - TS", () => {
	Authorization.calculateGasCost(smallList, 1);
});

bench("calculateGasCost - 2 auths - WASM", () => {
	gasCostWasm(2, 1);
});

await run();

// Gas cost calculation benchmarks - medium list
bench("calculateGasCost - 10 auths - TS", () => {
	Authorization.calculateGasCost(mediumList, 5);
});

bench("calculateGasCost - 10 auths - WASM", () => {
	gasCostWasm(10, 5);
});

await run();

// Gas cost calculation benchmarks - large list
bench("calculateGasCost - 100 auths - TS", () => {
	Authorization.calculateGasCost(largeList, 50);
});

bench("calculateGasCost - 100 auths - WASM", () => {
	gasCostWasm(100, 50);
});

await run();

// Additional TS-only operations (no WASM equivalent)
bench("isItem - valid - TS", () => {
	Authorization.isItem(validAuth);
});

bench("isItem - invalid - TS", () => {
	Authorization.isItem(null);
});

await run();

bench("isUnsigned - valid - TS", () => {
	Authorization.isUnsigned(unsignedAuth);
});

bench("isUnsigned - invalid - TS", () => {
	Authorization.isUnsigned(null);
});

await run();

bench("format - signed - TS", () => {
	Authorization.format(validAuth);
});

bench("format - unsigned - TS", () => {
	Authorization.format(unsignedAuth);
});

await run();

bench("getGasCost - not empty - TS", () => {
	Authorization.getGasCost(validAuth, false);
});

bench("getGasCost - empty account - TS", () => {
	Authorization.getGasCost(validAuth, true);
});

await run();

const auth2 = { ...validAuth };
const auth3 = { ...validAuth, nonce: 1n };

bench("equalsAuth - same - TS", () => {
	Authorization.equalsAuth(validAuth, auth2);
});

bench("equalsAuth - different - TS", () => {
	Authorization.equalsAuth(validAuth, auth3);
});

await run();
