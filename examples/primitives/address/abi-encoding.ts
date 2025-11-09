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

const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Encode to 32-byte ABI format (left-padded with zeros)
const encoded = addr.toAbiEncoded();

// Decode back to address
const decoded = Address.fromAbiEncoded(encoded);

// Example: decoding from contract return data
const returnData = Hex.toBytes(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e",
);
const addrFromReturn = Address.fromAbiEncoded(returnData);

// Example: transfer(address to, uint256 amount)
// Function selector: 0xa9059cbb (first 4 bytes of keccak256("transfer(address,uint256)"))
const functionSelector = "0xa9059cbb";
const toAddress = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
const amount = 1000n;

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

// Indexed addresses in topics are ABI-encoded (32 bytes)
const fromTopic = Hex.toBytes(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);
const toTopic = Hex.toBytes(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e",
);

const fromAddr = Address.fromAbiEncoded(fromTopic);
const toAddr = Address.fromAbiEncoded(toTopic);

// Example: multicall with array of targets
const targets = [
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Address.fromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
	Address.fromHex("0x0000000000000000000000000000000000000001"),
];

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

const numericAddr = Address.fromNumber(42n);

const abiEncoded = numericAddr.toAbiEncoded();

// Convert back via bigint
const asU256 = numericAddr.toU256();

// Wrong size for fromAbiEncoded
try {
	const wrongSize = new Uint8Array(20); // Must be 32 bytes
	Address.fromAbiEncoded(wrongSize);
} catch (e) {}

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

const invalid = new Uint8Array(32);
invalid[5] = 1; // Non-zero in padding region
