/**
 * ABI Encoding Example
 *
 * Demonstrates:
 * - Converting addresses to/from ABI-encoded format
 * - Understanding 32-byte ABI encoding (left-padded)
 * - Working with contract call data
 * - Extracting addresses from logs and return data
 * - Building function call payloads
 */

import { Address } from "../../../src/primitives/Address/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

console.log("=== ABI Encoding Example ===\n");

// 1. Basic ABI encoding
console.log("1. Basic ABI Encoding\n");

const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
console.log(`Original address: ${addr.toChecksummed()}`);
console.log(`Length: ${addr.length} bytes`);
console.log();

// Encode to 32-byte ABI format (left-padded with zeros)
const encoded = addr.toAbiEncoded();
console.log(`ABI-encoded: ${Hex.fromBytes(encoded)}`);
console.log(`Length: ${encoded.length} bytes`);
console.log();

// Show padding structure
console.log("Structure breakdown:");
console.log(`  First 12 bytes (padding): ${Hex.fromBytes(encoded.subarray(0, 12))}`);
console.log(
	`  Last 20 bytes (address):  ${Hex.fromBytes(encoded.subarray(12, 32))}`,
);
console.log();

// 2. Decoding ABI-encoded addresses
console.log("2. Decoding ABI-Encoded Addresses\n");

// Decode back to address
const decoded = Address.fromAbiEncoded(encoded);
console.log(`Decoded address: ${decoded.toChecksummed()}`);
console.log(`Equals original: ${decoded.equals(addr)}`);
console.log();

// Example: decoding from contract return data
const returnData = Hex.toBytes(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e",
);
const addrFromReturn = Address.fromAbiEncoded(returnData);
console.log("From contract return data:");
console.log(`  Raw: ${Hex.fromBytes(returnData)}`);
console.log(`  Decoded: ${addrFromReturn.toChecksummed()}`);
console.log();

// 3. Multiple addresses in calldata
console.log("3. Multiple Addresses in Calldata\n");

// Example: transfer(address to, uint256 amount)
// Function selector: 0xa9059cbb (first 4 bytes of keccak256("transfer(address,uint256)"))
const functionSelector = "0xa9059cbb";
const toAddress = Address.fromHex(
	"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
);
const amount = 1000n;

// Build calldata manually
console.log("Building transfer() calldata:");
console.log(`  Function: transfer(address,uint256)`);
console.log(`  Selector: ${functionSelector}`);
console.log(`  To: ${toAddress.toChecksummed()}`);
console.log(`  Amount: ${amount}`);
console.log();

// Encode address parameter
const encodedTo = toAddress.toAbiEncoded();

// Encode amount (32-byte big-endian)
const amountBytes = new Uint8Array(32);
const amountView = new DataView(amountBytes.buffer);
amountView.setBigUint64(24, amount, false); // Big-endian at offset 24

// Concatenate: selector + encodedTo + amountBytes
const selectorBytes = Hex.toBytes(functionSelector);
const calldata = new Uint8Array(
	selectorBytes.length + encodedTo.length + amountBytes.length,
);
calldata.set(selectorBytes, 0);
calldata.set(encodedTo, selectorBytes.length);
calldata.set(amountBytes, selectorBytes.length + encodedTo.length);

console.log(`Calldata: ${Hex.fromBytes(calldata)}`);
console.log(`  Bytes 0-3:   ${Hex.fromBytes(calldata.subarray(0, 4))} (selector)`);
console.log(
	`  Bytes 4-35:  ${Hex.fromBytes(calldata.subarray(4, 36))} (address)`,
);
console.log(
	`  Bytes 36-67: ${Hex.fromBytes(calldata.subarray(36, 68))} (amount)`,
);
console.log();

// 4. Extracting addresses from calldata
console.log("4. Extracting Addresses from Calldata\n");

// Parse address from calldata (skip selector, read first parameter)
function extractAddressParam(
	data: Uint8Array,
	paramIndex: number,
): Address | null {
	const offset = 4 + paramIndex * 32; // Skip 4-byte selector
	if (data.length < offset + 32) return null;

	const paramData = data.subarray(offset, offset + 32);
	return Address.fromAbiEncoded(paramData);
}

const extractedTo = extractAddressParam(calldata, 0);
console.log(`Extracted 'to' address: ${extractedTo?.toChecksummed()}`);
console.log(`Matches original: ${extractedTo?.equals(toAddress)}`);
console.log();

// 5. Working with event logs
console.log("5. Working with Event Logs\n");

// Example: Transfer event log
// Transfer(address indexed from, address indexed to, uint256 value)
console.log("Transfer event structure:");
console.log("  topic[0]: event signature hash");
console.log("  topic[1]: from address (indexed)");
console.log("  topic[2]: to address (indexed)");
console.log("  data:     amount (non-indexed)");
console.log();

// Indexed addresses in topics are ABI-encoded (32 bytes)
const fromTopic = Hex.toBytes(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);
const toTopic = Hex.toBytes(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e",
);

const fromAddr = Address.fromAbiEncoded(fromTopic);
const toAddr = Address.fromAbiEncoded(toTopic);

console.log(`From: ${fromAddr.toChecksummed()}`);
console.log(`To:   ${toAddr.toChecksummed()}`);
console.log();

// 6. Array of addresses
console.log("6. Array of Addresses in ABI\n");

// Example: multicall with array of targets
const targets = [
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Address.fromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
	Address.fromHex("0x0000000000000000000000000000000000000001"),
];

console.log("Encoding address array:");
console.log(`  Count: ${targets.length}`);

// Encode array: offset + length + elements
// offset (32 bytes) + length (32 bytes) + N * 32 bytes for elements
const arrayEncoding = new Uint8Array(32 + 32 + targets.length * 32);
const arrayView = new DataView(arrayEncoding.buffer);

// Offset to array data (typically 0x20 for dynamic arrays)
arrayView.setBigUint64(24, 32n, false); // Offset = 32

// Array length
arrayView.setBigUint64(32 + 24, BigInt(targets.length), false);

// Encode each address
for (let i = 0; i < targets.length; i++) {
	const encoded = targets[i].toAbiEncoded();
	arrayEncoding.set(encoded, 64 + i * 32);
}

console.log(`Encoded array: ${Hex.fromBytes(arrayEncoding)}`);
console.log(`  Offset:  ${Hex.fromBytes(arrayEncoding.subarray(0, 32))}`);
console.log(`  Length:  ${Hex.fromBytes(arrayEncoding.subarray(32, 64))}`);
console.log(`  Element 0: ${Hex.fromBytes(arrayEncoding.subarray(64, 96))}`);
console.log(`  Element 1: ${Hex.fromBytes(arrayEncoding.subarray(96, 128))}`);
console.log(`  Element 2: ${Hex.fromBytes(arrayEncoding.subarray(128, 160))}`);
console.log();

// 7. Numeric conversion via ABI encoding
console.log("7. Numeric Conversion via ABI Encoding\n");

const numericAddr = Address.fromNumber(42n);
console.log(`Address from number: ${numericAddr.toHex()}`);

const abiEncoded = numericAddr.toAbiEncoded();
console.log(`ABI-encoded: ${Hex.fromBytes(abiEncoded)}`);

// Convert back via bigint
const asU256 = numericAddr.toU256();
console.log(`As U256: ${asU256}`);
console.log(`Matches 42: ${asU256 === 42n}`);
console.log();

// 8. Error handling
console.log("8. Error Handling\n");

// Wrong size for fromAbiEncoded
try {
	const wrongSize = new Uint8Array(20); // Must be 32 bytes
	Address.fromAbiEncoded(wrongSize);
	console.log("ERROR: Should have thrown!");
} catch (e) {
	console.log(`✓ Wrong size rejected: ${(e as Error).message}`);
}

// Verify padding bytes are zero (good practice)
function isValidAbiEncoding(data: Uint8Array): boolean {
	if (data.length !== 32) return false;
	// Check first 12 bytes are zero
	for (let i = 0; i < 12; i++) {
		if (data[i] !== 0) return false;
	}
	return true;
}

const valid = addr.toAbiEncoded();
console.log(`✓ Valid padding: ${isValidAbiEncoding(valid)}`);

const invalid = new Uint8Array(32);
invalid[5] = 1; // Non-zero in padding region
console.log(`✗ Invalid padding: ${isValidAbiEncoding(invalid)}`);
console.log();

// 9. Common patterns
console.log("9. Common Patterns\n");

console.log("Reading address from contract return:");
console.log("  const addr = Address.fromAbiEncoded(returnData)");
console.log();

console.log("Encoding address for function call:");
console.log("  const encoded = addr.toAbiEncoded()");
console.log();

console.log("Parsing Transfer event logs:");
console.log("  const from = Address.fromAbiEncoded(topics[1])");
console.log("  const to = Address.fromAbiEncoded(topics[2])");
console.log();

console.log("Building calldata:");
console.log("  const calldata = concat([selector, addr.toAbiEncoded(), ...])");
