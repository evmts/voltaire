/**
 * EncodedData Benchmarks - mitata format
 * ABI-encoded data handling operations
 */

import { bench, run } from "mitata";
import * as EncodedData from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Single uint256 encoded
const uint256Encoded =
	"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000";

// Single address encoded
const addressEncoded =
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3";

// Multiple values (address, uint256, bool)
const multipleEncoded =
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3" +
	"0000000000000000000000000000000000000000000000000de0b6b3a7640000" +
	"0000000000000000000000000000000000000000000000000000000000000001";

// Dynamic string encoded
const stringEncoded =
	"0x0000000000000000000000000000000000000000000000000000000000000020" +
	"000000000000000000000000000000000000000000000000000000000000000d" +
	"48656c6c6f2c20576f726c642100000000000000000000000000000000000000";

// Dynamic bytes encoded
const bytesEncoded =
	"0x0000000000000000000000000000000000000000000000000000000000000020" +
	"0000000000000000000000000000000000000000000000000000000000000040" +
	"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" +
	"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// Array encoded (uint256[])
const arrayEncoded =
	"0x0000000000000000000000000000000000000000000000000000000000000020" +
	"0000000000000000000000000000000000000000000000000000000000000003" +
	"0000000000000000000000000000000000000000000000000000000000000001" +
	"0000000000000000000000000000000000000000000000000000000000000002" +
	"0000000000000000000000000000000000000000000000000000000000000003";

// Large encoded data (~1KB)
const largeEncoded = "0x" + "00".repeat(32) + "ab".repeat(480);

// Empty encoded data
const emptyEncoded = "0x";

// Bytes versions
const uint256Bytes = new Uint8Array(32);
uint256Bytes.set([0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00], 24);

// Pre-created instances
const uint256Instance = EncodedData.from(uint256Encoded);
const addressInstance = EncodedData.from(addressEncoded);
const multipleInstance = EncodedData.from(multipleEncoded);
const stringInstance = EncodedData.from(stringEncoded);
const bytesInstance = EncodedData.from(bytesEncoded);
const arrayInstance = EncodedData.from(arrayEncoded);
const largeInstance = EncodedData.from(largeEncoded);
const emptyInstance = EncodedData.from(emptyEncoded);

// ============================================================================
// EncodedData.from - construction
// ============================================================================

bench("EncodedData.from(hex) - uint256 - voltaire", () => {
	EncodedData.from(uint256Encoded);
});

bench("EncodedData.from(hex) - address - voltaire", () => {
	EncodedData.from(addressEncoded);
});

bench("EncodedData.from(hex) - multiple - voltaire", () => {
	EncodedData.from(multipleEncoded);
});

bench("EncodedData.from(hex) - string - voltaire", () => {
	EncodedData.from(stringEncoded);
});

bench("EncodedData.from(hex) - array - voltaire", () => {
	EncodedData.from(arrayEncoded);
});

bench("EncodedData.from(hex) - large (1KB) - voltaire", () => {
	EncodedData.from(largeEncoded);
});

bench("EncodedData.from(hex) - empty - voltaire", () => {
	EncodedData.from(emptyEncoded);
});

await run();

// ============================================================================
// EncodedData.fromBytes
// ============================================================================

bench("EncodedData.fromBytes - uint256 - voltaire", () => {
	EncodedData.fromBytes(uint256Bytes);
});

await run();

// ============================================================================
// EncodedData.toBytes
// ============================================================================

bench("EncodedData.toBytes - uint256 - voltaire", () => {
	EncodedData.toBytes(uint256Instance);
});

bench("EncodedData.toBytes - multiple - voltaire", () => {
	EncodedData.toBytes(multipleInstance);
});

bench("EncodedData.toBytes - array - voltaire", () => {
	EncodedData.toBytes(arrayInstance);
});

bench("EncodedData.toBytes - large - voltaire", () => {
	EncodedData.toBytes(largeInstance);
});

await run();

// ============================================================================
// EncodedData.equals
// ============================================================================

const uint256Instance2 = EncodedData.from(uint256Encoded);

bench("EncodedData.equals - same - voltaire", () => {
	EncodedData.equals(uint256Instance, uint256Instance2);
});

bench("EncodedData.equals - different - voltaire", () => {
	EncodedData.equals(uint256Instance, addressInstance);
});

bench("EncodedData.equals - empty - voltaire", () => {
	EncodedData.equals(emptyInstance, emptyInstance);
});

bench("EncodedData.equals - large - voltaire", () => {
	EncodedData.equals(largeInstance, largeInstance);
});

await run();

// ============================================================================
// Round-trip operations
// ============================================================================

bench("roundtrip (from+toBytes) - uint256 - voltaire", () => {
	const ed = EncodedData.from(uint256Encoded);
	EncodedData.toBytes(ed);
});

bench("roundtrip (from+toBytes) - multiple - voltaire", () => {
	const ed = EncodedData.from(multipleEncoded);
	EncodedData.toBytes(ed);
});

bench("roundtrip (from+toBytes) - array - voltaire", () => {
	const ed = EncodedData.from(arrayEncoded);
	EncodedData.toBytes(ed);
});

bench("roundtrip (from+toBytes) - large - voltaire", () => {
	const ed = EncodedData.from(largeEncoded);
	EncodedData.toBytes(ed);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const encodedValues = [
	uint256Encoded,
	addressEncoded,
	multipleEncoded,
	stringEncoded,
];

bench("batch from(hex) - 4 values - voltaire", () => {
	for (const val of encodedValues) {
		EncodedData.from(val);
	}
});

await run();
