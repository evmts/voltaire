/**
 * Benchmark: JS vs WASM vs ethers vs viem Address implementations
 * Compares performance of Address operations across different backends
 */

import { bench, run } from "mitata";
import { Address as JsAddress } from "./Address.js";
import { Address as WasmAddress } from "./Address.wasm.js";
import { loadWasm } from "../../wasm-loader/loader.js";
import { getAddress as ethersGetAddress, isAddress as ethersIsAddress, getCreateAddress, getCreate2Address } from "ethers";
import { getAddress as viemGetAddress, isAddress as viemIsAddress, isAddressEqual, getContractAddress, keccak256 } from "viem";

// Load WASM before running benchmarks
await loadWasm(new URL("../../wasm-loader/primitives.wasm", import.meta.url));

// Test addresses for benchmarks
const testAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const checksummedAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const zeroAddress = "0x0000000000000000000000000000000000000000";
const address1 = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const address2 = "0x1234567890123456789012345678901234567890";

// Pre-instantiated addresses for comparison benchmarks
const jsAddr1 = JsAddress.fromHex(address1);
const jsAddr2 = JsAddress.fromHex(address2);
const jsAddrZero = JsAddress.fromHex(zeroAddress);
const wasmAddr1 = WasmAddress.fromHex(address1);
const wasmAddr2 = WasmAddress.fromHex(address2);
const wasmAddrZero = WasmAddress.fromHex(zeroAddress);

// CREATE/CREATE2 test data
const senderAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const senderAddressLower = senderAddress.toLowerCase();
const jsSender = JsAddress.fromHex(senderAddress);
const wasmSender = WasmAddress.fromHex(senderAddress);
const nonce = 42n;
const salt = new Uint8Array(32).fill(0x42);
const initCode = new Uint8Array([
	0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15,
	0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15,
]);

// Test bytes for fromBytes
const testBytes = new Uint8Array(20);
for (let i = 0; i < 20; i++) {
	testBytes[i] = i + 1;
}

// Test number for fromNumber
const testNumber = 123456789n;

// Test public key coordinates for fromPublicKey
const pubkeyX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
const pubkeyY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;

console.log("=".repeat(80));
console.log("JS vs WASM vs ethers vs viem Address Implementation Benchmark");
console.log("=".repeat(80));
console.log("");

// =============================================================================
// 1. Address.fromHex - Parse hex string to Address
// =============================================================================

console.log("1. Address.fromHex - Parse hex string to Address");
console.log("-".repeat(80));

bench("Address.fromHex - JS", () => {
	JsAddress.fromHex(testAddress);
});

bench("Address.fromHex - WASM", () => {
	WasmAddress.fromHex(testAddress);
});

bench("Address.fromHex - ethers", () => {
	ethersGetAddress(testAddress.toLowerCase());
});

bench("Address.fromHex - viem", () => {
	viemGetAddress(testAddress);
});

await run();
console.log("");

// =============================================================================
// 2. Address.fromBytes - Create from byte array
// =============================================================================

console.log("2. Address.fromBytes - Create from byte array");
console.log("-".repeat(80));

bench("Address.fromBytes - JS", () => {
	JsAddress.fromBytes(testBytes);
});

bench("Address.fromBytes - WASM", () => {
	WasmAddress.fromBytes(testBytes);
});

await run();
console.log("");

// =============================================================================
// 3. Address.fromNumber - Create from number/bigint
// =============================================================================

console.log("3. Address.fromNumber - Create from number/bigint");
console.log("-".repeat(80));

bench("Address.fromNumber - JS", () => {
	JsAddress.fromNumber(testNumber);
});

bench("Address.fromNumber - WASM", () => {
	WasmAddress.fromNumber(testNumber);
});

await run();
console.log("");

// =============================================================================
// 4. Address.fromPublicKey - Derive from secp256k1 public key
// =============================================================================

console.log("4. Address.fromPublicKey - Derive from secp256k1 public key");
console.log("-".repeat(80));

bench("Address.fromPublicKey - JS", () => {
	JsAddress.fromPublicKey(pubkeyX, pubkeyY);
});

bench("Address.fromPublicKey - WASM", () => {
	WasmAddress.fromPublicKey(pubkeyX, pubkeyY);
});

await run();
console.log("");

// =============================================================================
// 5. address.toHex - Convert to lowercase hex string
// =============================================================================

console.log("5. address.toHex - Convert to lowercase hex string");
console.log("-".repeat(80));

bench("address.toHex - JS", () => {
	JsAddress.toHex(jsAddr1);
});

bench("address.toHex - WASM", () => {
	WasmAddress.toHex(wasmAddr1);
});

await run();
console.log("");

// =============================================================================
// 6. address.toChecksummed - EIP-55 checksum
// =============================================================================

console.log("6. address.toChecksummed - EIP-55 checksum");
console.log("-".repeat(80));

bench("address.toChecksummed - JS", () => {
	JsAddress.toChecksummed(jsAddr1);
});

bench("address.toChecksummed - WASM", () => {
	WasmAddress.toChecksummed(wasmAddr1);
});

bench("address.toChecksummed - ethers", () => {
	ethersGetAddress(testAddress.toLowerCase());
});

bench("address.toChecksummed - viem", () => {
	viemGetAddress(testAddress);
});

await run();
console.log("");

// =============================================================================
// 7. address.toLowercase - Lowercase hex
// =============================================================================

console.log("7. address.toLowercase - Lowercase hex");
console.log("-".repeat(80));

bench("address.toLowercase - JS", () => {
	JsAddress.toLowercase(jsAddr1);
});

bench("address.toLowercase - WASM", () => {
	WasmAddress.toLowercase(wasmAddr1);
});

await run();
console.log("");

// =============================================================================
// 8. address.toUppercase - Uppercase hex
// =============================================================================

console.log("8. address.toUppercase - Uppercase hex");
console.log("-".repeat(80));

bench("address.toUppercase - JS", () => {
	JsAddress.toUppercase(jsAddr1);
});

bench("address.toUppercase - WASM", () => {
	WasmAddress.toUppercase(wasmAddr1);
});

await run();
console.log("");

// =============================================================================
// 9. address.toU256 - Convert to Uint256
// =============================================================================

console.log("9. address.toU256 - Convert to Uint256");
console.log("-".repeat(80));

bench("address.toU256 - JS", () => {
	JsAddress.toU256(jsAddr1);
});

bench("address.toU256 - WASM", () => {
	WasmAddress.toU256(wasmAddr1);
});

await run();
console.log("");

// =============================================================================
// 10. address.toAbiEncoded - ABI encoding
// =============================================================================

console.log("10. address.toAbiEncoded - ABI encoding");
console.log("-".repeat(80));

bench("address.toAbiEncoded - JS", () => {
	JsAddress.toAbiEncoded(jsAddr1);
});

bench("address.toAbiEncoded - WASM", () => {
	WasmAddress.toAbiEncoded(wasmAddr1);
});

await run();
console.log("");

// =============================================================================
// 11. address.toShortHex - Abbreviated hex
// =============================================================================

console.log("11. address.toShortHex - Abbreviated hex");
console.log("-".repeat(80));

bench("address.toShortHex - JS", () => {
	JsAddress.toShortHex(jsAddr1);
});

bench("address.toShortHex - WASM", () => {
	WasmAddress.toShortHex(wasmAddr1);
});

await run();
console.log("");

// =============================================================================
// 12. address.isZero - Check for zero address
// =============================================================================

console.log("12. address.isZero - Check for zero address");
console.log("-".repeat(80));

bench("address.isZero - JS (zero)", () => {
	JsAddress.isZero(jsAddrZero);
});

bench("address.isZero - WASM (zero)", () => {
	WasmAddress.isZero(wasmAddrZero);
});

bench("address.isZero - JS (non-zero)", () => {
	JsAddress.isZero(jsAddr1);
});

bench("address.isZero - WASM (non-zero)", () => {
	WasmAddress.isZero(wasmAddr1);
});

await run();
console.log("");

// =============================================================================
// 13. address.equals - Compare addresses
// =============================================================================

console.log("13. address.equals - Compare addresses");
console.log("-".repeat(80));

bench("address.equals - JS (same)", () => {
	JsAddress.equals(jsAddr1, jsAddr1);
});

bench("address.equals - WASM (same)", () => {
	WasmAddress.equals(wasmAddr1, wasmAddr1);
});

bench("address.equals - ethers (same)", () => {
	ethersGetAddress(address1) === ethersGetAddress(address1);
});

bench("address.equals - viem (same)", () => {
	isAddressEqual(address1, address1);
});

bench("address.equals - JS (different)", () => {
	JsAddress.equals(jsAddr1, jsAddr2);
});

bench("address.equals - WASM (different)", () => {
	WasmAddress.equals(wasmAddr1, wasmAddr2);
});

bench("address.equals - ethers (different)", () => {
	ethersGetAddress(address1) === ethersGetAddress(address2);
});

bench("address.equals - viem (different)", () => {
	isAddressEqual(address1, address2);
});

await run();
console.log("");

// =============================================================================
// 14. Address.isValid - Validate hex format
// =============================================================================

console.log("14. Address.isValid - Validate hex format");
console.log("-".repeat(80));

bench("Address.isValid - JS (valid)", () => {
	JsAddress.isValid(testAddress);
});

bench("Address.isValid - WASM (valid)", () => {
	WasmAddress.isValid(testAddress);
});

bench("Address.isValid - ethers (valid)", () => {
	ethersIsAddress(testAddress);
});

bench("Address.isValid - viem (valid)", () => {
	viemIsAddress(testAddress);
});

bench("Address.isValid - JS (invalid)", () => {
	JsAddress.isValid("0xinvalid");
});

bench("Address.isValid - WASM (invalid)", () => {
	WasmAddress.isValid("0xinvalid");
});

bench("Address.isValid - ethers (invalid)", () => {
	ethersIsAddress("0xinvalid");
});

bench("Address.isValid - viem (invalid)", () => {
	viemIsAddress("0xinvalid");
});

await run();
console.log("");

// =============================================================================
// 15. Address.isValidChecksum - Validate EIP-55
// =============================================================================

console.log("15. Address.isValidChecksum - Validate EIP-55");
console.log("-".repeat(80));

bench("Address.isValidChecksum - JS", () => {
	JsAddress.isValidChecksum(checksummedAddress);
});

bench("Address.isValidChecksum - WASM", () => {
	WasmAddress.isValidChecksum(checksummedAddress);
});

bench("Address.isValidChecksum - ethers", () => {
	try {
		ethersGetAddress(checksummedAddress);
	} catch {
		// Invalid checksum throws
	}
});

bench("Address.isValidChecksum - viem", () => {
	viemIsAddress(checksummedAddress, { strict: true });
});

await run();
console.log("");

// =============================================================================
// 16. Address.compare - Lexicographic comparison
// =============================================================================

console.log("16. Address.compare - Lexicographic comparison");
console.log("-".repeat(80));

bench("Address.compare - JS", () => {
	JsAddress.compare(jsAddr1, jsAddr2);
});

bench("Address.compare - WASM", () => {
	WasmAddress.compare(wasmAddr1, wasmAddr2);
});

await run();
console.log("");

// =============================================================================
// 17. Address.lessThan - Less than comparison
// =============================================================================

console.log("17. Address.lessThan - Less than comparison");
console.log("-".repeat(80));

bench("Address.lessThan - JS", () => {
	JsAddress.lessThan(jsAddr1, jsAddr2);
});

bench("Address.lessThan - WASM", () => {
	WasmAddress.lessThan(wasmAddr1, wasmAddr2);
});

await run();
console.log("");

// =============================================================================
// 18. Address.greaterThan - Greater than comparison
// =============================================================================

console.log("18. Address.greaterThan - Greater than comparison");
console.log("-".repeat(80));

bench("Address.greaterThan - JS", () => {
	JsAddress.greaterThan(jsAddr1, jsAddr2);
});

bench("Address.greaterThan - WASM", () => {
	WasmAddress.greaterThan(wasmAddr1, wasmAddr2);
});

await run();
console.log("");

// =============================================================================
// 19. Address.calculateCreateAddress - CREATE address
// =============================================================================

console.log("19. Address.calculateCreateAddress - CREATE address");
console.log("-".repeat(80));

bench("Address.calculateCreateAddress - JS", () => {
	JsAddress.calculateCreateAddress(jsSender, nonce);
});

bench("Address.calculateCreateAddress - WASM", () => {
	WasmAddress.calculateCreateAddress(wasmSender, nonce);
});

bench("Address.calculateCreateAddress - ethers", () => {
	getCreateAddress({ from: senderAddressLower, nonce });
});

bench("Address.calculateCreateAddress - viem", () => {
	getContractAddress({ from: senderAddress, nonce: Number(nonce), opcode: "CREATE" });
});

await run();
console.log("");

// =============================================================================
// 20. Address.calculateCreate2Address - CREATE2 address
// =============================================================================

console.log("20. Address.calculateCreate2Address - CREATE2 address");
console.log("-".repeat(80));

// Pre-compute initCodeHash for ethers (requires keccak256 hash)
const initCodeHash = keccak256(initCode);

bench("Address.calculateCreate2Address - JS", () => {
	JsAddress.calculateCreate2Address(jsSender, salt, initCode);
});

bench("Address.calculateCreate2Address - WASM", () => {
	WasmAddress.calculateCreate2Address(wasmSender, salt, initCode);
});

bench("Address.calculateCreate2Address - ethers", () => {
	getCreate2Address(senderAddressLower, salt, initCodeHash);
});

bench("Address.calculateCreate2Address - viem", () => {
	getContractAddress({
		from: senderAddress,
		bytecode: initCode,
		salt,
		opcode: "CREATE2"
	});
});

await run();
console.log("");

console.log("=".repeat(80));
console.log("Benchmark Complete - JS vs WASM vs ethers vs viem Address");
console.log("=".repeat(80));
