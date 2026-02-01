/**
 * Benchmark: ABI WASM vs TypeScript Implementation
 *
 * Compares WASM-based ABI encoding/decoding with pure TypeScript
 */

import { bench, run } from "mitata";
import * as loader from "../../../wasm-loader/loader.js";
import * as AbiTs from "../Encoding.js";
import {
	decodeParametersWasm,
	decodeFunctionDataWasm,
	encodePackedWasm,
	encodeParametersWasm,
	encodeFunctionDataWasm,
} from "./wasm.js";

// Initialize WASM
await loader.loadWasm(
	new URL("../../../wasm-loader/primitives.wasm", import.meta.url),
);

// ============================================================================
// Test Data
// ============================================================================

const zeroAddress = "0x0000000000000000000000000000000000000000";
const testAddress = "0x1234567890abcdef1234567890abcdef12345678";

const simpleParams = [{ type: "uint256" }] as const;
const simpleValues = [42n];

const addressParams = [{ type: "address" }] as const;
const addressValues = [zeroAddress];

const mixedParams = [
	{ type: "address" },
	{ type: "uint256" },
	{ type: "bool" },
] as const;
const mixedValues = [testAddress, 1000000n, true];

const stringParams = [{ type: "string" }] as const;
const stringValues = ["Hello, Ethereum!"];

const bytesParams = [{ type: "bytes" }] as const;
const bytesValues = [new Uint8Array(32).fill(0xab)];

const arrayParams = [{ type: "uint256[]" }] as const;
const arrayValues = [[1n, 2n, 3n, 4n, 5n]];

// Pre-encode for decode benchmarks
const encodedSimple = AbiTs.encodeParameters(simpleParams, simpleValues);
const encodedAddress = AbiTs.encodeParameters(addressParams, addressValues);
const encodedMixed = AbiTs.encodeParameters(mixedParams, mixedValues as any);

// ============================================================================
// Encode Parameters - Simple (uint256)
// ============================================================================

bench("encodeParameters uint256 - TS", () => {
	AbiTs.encodeParameters(simpleParams, simpleValues);
});

bench("encodeParameters uint256 - WASM", () => {
	encodeParametersWasm(simpleParams as any, simpleValues as any);
});

await run();

// ============================================================================
// Encode Parameters - Address
// ============================================================================

bench("encodeParameters address - TS", () => {
	AbiTs.encodeParameters(addressParams, addressValues);
});

bench("encodeParameters address - WASM", () => {
	encodeParametersWasm(addressParams as any, addressValues as any);
});

await run();

// ============================================================================
// Encode Parameters - Mixed (address, uint256, bool)
// ============================================================================

bench("encodeParameters mixed - TS", () => {
	AbiTs.encodeParameters(mixedParams, mixedValues as any);
});

bench("encodeParameters mixed - WASM", () => {
	encodeParametersWasm(mixedParams as any, mixedValues as any);
});

await run();

// ============================================================================
// Encode Parameters - String
// ============================================================================

bench("encodeParameters string - TS", () => {
	AbiTs.encodeParameters(stringParams, stringValues);
});

bench("encodeParameters string - WASM", () => {
	encodeParametersWasm(stringParams as any, stringValues as any);
});

await run();

// ============================================================================
// Encode Parameters - Bytes
// ============================================================================

bench("encodeParameters bytes - TS", () => {
	AbiTs.encodeParameters(bytesParams, bytesValues);
});

bench("encodeParameters bytes - WASM", () => {
	encodeParametersWasm(bytesParams as any, bytesValues as any);
});

await run();

// ============================================================================
// Encode Parameters - Array
// ============================================================================

bench("encodeParameters uint256[] - TS", () => {
	AbiTs.encodeParameters(arrayParams, arrayValues as any);
});

bench("encodeParameters uint256[] - WASM", () => {
	encodeParametersWasm(arrayParams as any, arrayValues as any);
});

await run();

// ============================================================================
// Decode Parameters - Simple (uint256)
// ============================================================================

bench("decodeParameters uint256 - TS", () => {
	AbiTs.decodeParameters(simpleParams, encodedSimple);
});

bench("decodeParameters uint256 - WASM", () => {
	decodeParametersWasm(simpleParams as any, encodedSimple);
});

await run();

// ============================================================================
// Decode Parameters - Address
// ============================================================================

bench("decodeParameters address - TS", () => {
	AbiTs.decodeParameters(addressParams, encodedAddress);
});

bench("decodeParameters address - WASM", () => {
	decodeParametersWasm(addressParams as any, encodedAddress);
});

await run();

// ============================================================================
// Decode Parameters - Mixed
// ============================================================================

bench("decodeParameters mixed - TS", () => {
	AbiTs.decodeParameters(mixedParams, encodedMixed);
});

bench("decodeParameters mixed - WASM", () => {
	decodeParametersWasm(mixedParams as any, encodedMixed);
});

await run();

// ============================================================================
// Encode Function Data
// ============================================================================

const transferSig = "transfer(address,uint256)";
const transferParams = [{ type: "address" }, { type: "uint256" }] as const;
const transferValues = [testAddress, 1000000000000000000n];

bench("encodeFunctionData transfer - WASM", () => {
	encodeFunctionDataWasm(
		transferSig,
		transferParams as any,
		transferValues as any,
	);
});

await run();

// ============================================================================
// Encode Packed
// ============================================================================

bench("encodePacked (address, uint256) - WASM", () => {
	encodePackedWasm(["address", "uint256"], [testAddress, 1000n]);
});

bench("encodePacked (string, uint256) - WASM", () => {
	encodePackedWasm(["string", "uint256"], ["Hello", 42n]);
});

await run();

// ============================================================================
// Round-trip (Encode + Decode)
// ============================================================================

bench("round-trip uint256 - TS", () => {
	const encoded = AbiTs.encodeParameters(simpleParams, simpleValues);
	AbiTs.decodeParameters(simpleParams, encoded);
});

bench("round-trip uint256 - WASM", () => {
	const encoded = encodeParametersWasm(
		simpleParams as any,
		simpleValues as any,
	);
	decodeParametersWasm(simpleParams as any, encoded);
});

await run();

bench("round-trip mixed - TS", () => {
	const encoded = AbiTs.encodeParameters(mixedParams, mixedValues as any);
	AbiTs.decodeParameters(mixedParams, encoded);
});

bench("round-trip mixed - WASM", () => {
	const encoded = encodeParametersWasm(mixedParams as any, mixedValues as any);
	decodeParametersWasm(mixedParams as any, encoded);
});

await run();
