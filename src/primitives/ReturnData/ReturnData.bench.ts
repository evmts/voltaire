/**
 * ReturnData Benchmarks - mitata format
 * EVM return data handling operations
 */

import { bench, run } from "mitata";
import * as ReturnData from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Empty return (success with no data)
const emptyReturn = "0x";

// Boolean return (true)
const boolTrueReturn =
	"0x0000000000000000000000000000000000000000000000000000000000000001";

// Boolean return (false)
const boolFalseReturn =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

// uint256 return
const uint256Return =
	"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000";

// Address return
const addressReturn =
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3";

// Multiple values return (address, uint256, bool)
const multiReturn =
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3" +
	"0000000000000000000000000000000000000000000000000de0b6b3a7640000" +
	"0000000000000000000000000000000000000000000000000000000000000001";

// String return (dynamic)
const stringReturn =
	"0x0000000000000000000000000000000000000000000000000000000000000020" +
	"000000000000000000000000000000000000000000000000000000000000000d" +
	"48656c6c6f2c20576f726c642100000000000000000000000000000000000000";

// Large return (1KB)
const largeReturn = "0x" + "ab".repeat(512);

// Bytes versions
const boolTrueBytes = new Uint8Array(32);
boolTrueBytes[31] = 1;

const emptyBytes = new Uint8Array(0);

// Pre-created instances
const emptyInstance = ReturnData.from(emptyReturn);
const boolTrueInstance = ReturnData.from(boolTrueReturn);
const uint256Instance = ReturnData.from(uint256Return);
const multiInstance = ReturnData.from(multiReturn);
const largeInstance = ReturnData.from(largeReturn);

// ============================================================================
// ReturnData.from - construction
// ============================================================================

bench("ReturnData.from(hex) - empty - voltaire", () => {
	ReturnData.from(emptyReturn);
});

bench("ReturnData.from(hex) - bool - voltaire", () => {
	ReturnData.from(boolTrueReturn);
});

bench("ReturnData.from(hex) - uint256 - voltaire", () => {
	ReturnData.from(uint256Return);
});

bench("ReturnData.from(hex) - multi - voltaire", () => {
	ReturnData.from(multiReturn);
});

bench("ReturnData.from(hex) - large (1KB) - voltaire", () => {
	ReturnData.from(largeReturn);
});

await run();

// ============================================================================
// ReturnData.fromHex
// ============================================================================

bench("ReturnData.fromHex - bool - voltaire", () => {
	ReturnData.fromHex(boolTrueReturn);
});

bench("ReturnData.fromHex - multi - voltaire", () => {
	ReturnData.fromHex(multiReturn);
});

await run();

// ============================================================================
// ReturnData.fromBytes
// ============================================================================

bench("ReturnData.fromBytes - empty - voltaire", () => {
	ReturnData.fromBytes(emptyBytes);
});

bench("ReturnData.fromBytes - bool - voltaire", () => {
	ReturnData.fromBytes(boolTrueBytes);
});

await run();

// ============================================================================
// ReturnData.toHex
// ============================================================================

bench("ReturnData.toHex - empty - voltaire", () => {
	ReturnData.toHex(emptyInstance);
});

bench("ReturnData.toHex - bool - voltaire", () => {
	ReturnData.toHex(boolTrueInstance);
});

bench("ReturnData.toHex - multi - voltaire", () => {
	ReturnData.toHex(multiInstance);
});

bench("ReturnData.toHex - large (1KB) - voltaire", () => {
	ReturnData.toHex(largeInstance);
});

await run();

// ============================================================================
// ReturnData.toBytes
// ============================================================================

bench("ReturnData.toBytes - empty - voltaire", () => {
	ReturnData.toBytes(emptyInstance);
});

bench("ReturnData.toBytes - bool - voltaire", () => {
	ReturnData.toBytes(boolTrueInstance);
});

bench("ReturnData.toBytes - large - voltaire", () => {
	ReturnData.toBytes(largeInstance);
});

await run();

// ============================================================================
// ReturnData.isEmpty
// ============================================================================

bench("ReturnData.isEmpty - empty - voltaire", () => {
	ReturnData.isEmpty(emptyInstance);
});

bench("ReturnData.isEmpty - non-empty - voltaire", () => {
	ReturnData.isEmpty(boolTrueInstance);
});

await run();

// ============================================================================
// ReturnData.equals
// ============================================================================

const boolTrueInstance2 = ReturnData.from(boolTrueReturn);

bench("ReturnData.equals - same - voltaire", () => {
	ReturnData.equals(boolTrueInstance, boolTrueInstance2);
});

bench("ReturnData.equals - different - voltaire", () => {
	ReturnData.equals(boolTrueInstance, uint256Instance);
});

bench("ReturnData.equals - empty - voltaire", () => {
	ReturnData.equals(emptyInstance, emptyInstance);
});

await run();

// ============================================================================
// Round-trip operations
// ============================================================================

bench("roundtrip (from+toHex) - bool - voltaire", () => {
	const rd = ReturnData.from(boolTrueReturn);
	ReturnData.toHex(rd);
});

bench("roundtrip (from+toHex) - multi - voltaire", () => {
	const rd = ReturnData.from(multiReturn);
	ReturnData.toHex(rd);
});

bench("roundtrip (from+toHex) - large - voltaire", () => {
	const rd = ReturnData.from(largeReturn);
	ReturnData.toHex(rd);
});

await run();
