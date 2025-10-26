/**
 * EIP-191 and EIP-712 Usage Examples
 *
 * This file demonstrates how to use the EIP-191 (Personal Sign) and EIP-712 (Typed Data)
 * signing utilities in the primitives library.
 *
 * IMPORTANT NOTES:
 * - The hashing functions are fully implemented and use the Zig/C backend
 * - Signing/verification functions require secp256k1 C API bindings (not yet implemented)
 * - This is unaudited cryptographic code - use with caution in production
 */

import {
	hashMessage,
	hashTypedData,
	hashDomain,
	type TypedData,
	type TypedDataDomain,
} from "../src/crypto/index.ts";

// =============================================================================
// EIP-191 Personal Message Signing
// =============================================================================

console.log("=== EIP-191 Personal Message Signing ===\n");

// Example 1: Hash a simple text message
const message1 = "Hello, Ethereum!";
const hash1 = hashMessage(message1);
console.log(`Message: "${message1}"`);
console.log(`Hash: ${hash1}`);
console.log();

// Example 2: Hash a message from bytes
const message2 = new TextEncoder().encode("Sign this message");
const hash2 = hashMessage(message2);
console.log("Message (from Uint8Array):", new TextDecoder().decode(message2));
console.log(`Hash: ${hash2}`);
console.log();

// Example 3: Demonstrate deterministic hashing
const message3 = "Deterministic test";
const hash3a = hashMessage(message3);
const hash3b = hashMessage(message3);
console.log(`Message: "${message3}"`);
console.log("Hash (first call):", hash3a);
console.log("Hash (second call):", hash3b);
console.log("Hashes match:", hash3a === hash3b);
console.log();

// =============================================================================
// EIP-712 Typed Data Signing
// =============================================================================

console.log("\n=== EIP-712 Typed Data Signing ===\n");

// Example 4: Simple typed message
const simpleTypedData: TypedData = {
	types: {
		Person: [
			{ name: "name", type: "string" },
			{ name: "wallet", type: "address" },
		],
	},
	primaryType: "Person",
	domain: {
		name: "Simple Example",
		version: "1",
		chainId: 1,
	},
	message: {
		name: "Alice",
		wallet: "0x1234567890123456789012345678901234567890",
	},
};

const simpleHash = hashTypedData(simpleTypedData);
console.log("Simple typed data:");
console.log("Message:", JSON.stringify(simpleTypedData.message, null, 2));
console.log("Hash:", simpleHash);
console.log();

// Example 5: Nested structures (EIP-712 Mail example from spec)
const mailTypedData: TypedData = {
	types: {
		Person: [
			{ name: "name", type: "string" },
			{ name: "wallet", type: "address" },
		],
		Mail: [
			{ name: "from", type: "Person" },
			{ name: "to", type: "Person" },
			{ name: "contents", type: "string" },
		],
	},
	primaryType: "Mail",
	domain: {
		name: "Ether Mail",
		version: "1",
		chainId: 1,
		verifyingContract:
			"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as `0x${string}`,
	},
	message: {
		from: {
			name: "Alice",
			wallet: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		},
		to: {
			name: "Bob",
			wallet: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
		},
		contents: "Hello, Bob!",
	},
};

const mailHash = hashTypedData(mailTypedData);
console.log("Nested structure (Mail):");
console.log("Message:", JSON.stringify(mailTypedData.message, null, 2));
console.log("Hash:", mailHash);
console.log();

// Example 6: Transaction data with multiple types
const transactionTypedData: TypedData = {
	types: {
		Transaction: [
			{ name: "to", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "gas", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "data", type: "bytes" },
		],
	},
	primaryType: "Transaction",
	domain: {
		name: "MyDApp",
		version: "2.0",
		chainId: 1,
	},
	message: {
		to: "0x1111111111111111111111111111111111111111",
		value: "1000000000000000000", // 1 ETH in wei
		gas: "21000",
		nonce: "42",
		data: "0x",
	},
};

const txHash = hashTypedData(transactionTypedData);
console.log("Transaction data:");
console.log("Message:", JSON.stringify(transactionTypedData.message, null, 2));
console.log("Hash:", txHash);
console.log();

// Example 7: Domain separator hashing
const domain: TypedDataDomain = {
	name: "My Application",
	version: "1.0.0",
	chainId: 1,
	verifyingContract:
		"0x1234567890123456789012345678901234567890" as `0x${string}`,
};

const domainHash = hashDomain(domain);
console.log("Domain separator:");
console.log("Domain:", JSON.stringify(domain, null, 2));
console.log("Hash:", domainHash);
console.log();

// Example 8: Different types demonstration
const multiTypeData: TypedData = {
	types: {
		Settings: [
			{ name: "enabled", type: "bool" },
			{ name: "count", type: "uint256" },
			{ name: "owner", type: "address" },
			{ name: "description", type: "string" },
		],
	},
	primaryType: "Settings",
	domain: {
		name: "Settings Demo",
		version: "1",
	},
	message: {
		enabled: true,
		count: 42,
		owner: "0x9999999999999999999999999999999999999999",
		description: "Demo settings",
	},
};

const multiTypeHash = hashTypedData(multiTypeData);
console.log("Multiple types:");
console.log("Message:", JSON.stringify(multiTypeData.message, null, 2));
console.log("Hash:", multiTypeHash);
console.log();

// Example 9: Array handling
const arrayData: TypedData = {
	types: {
		Batch: [
			{ name: "ids", type: "uint256[]" },
			{ name: "name", type: "string" },
		],
	},
	primaryType: "Batch",
	domain: {
		name: "Array Demo",
		version: "1",
	},
	message: {
		ids: [1, 2, 3, 4, 5],
		name: "Batch operations",
	},
};

const arrayHash = hashTypedData(arrayData);
console.log("Array handling:");
console.log("Message:", JSON.stringify(arrayData.message, null, 2));
console.log("Hash:", arrayHash);
console.log();

// =============================================================================
// Signing and Verification (Not yet implemented)
// =============================================================================

console.log("\n=== Signing and Verification (Future) ===\n");
console.log("The following operations require secp256k1 C API bindings:");
console.log("- signMessage(message, privateKey)");
console.log("- verifyMessage(message, signature, address)");
console.log("- recoverMessageAddress(message, signature)");
console.log("- signTypedData(typedData, privateKey)");
console.log("- verifyTypedData(typedData, signature, address)");
console.log("- recoverTypedDataAddress(typedData, signature)");
console.log();
console.log(
	"These functions are defined but throw errors until C API is complete.",
);
console.log();

// =============================================================================
// Zig Implementation Reference
// =============================================================================

console.log("\n=== Zig Implementation Reference ===\n");
console.log("Hash functions used:");
console.log("- EIP-191: crypto.HashUtils.eip191HashMessage() via C FFI");
console.log("- EIP-712: Pure TypeScript with keccak256 via C FFI");
console.log();
console.log("Future signing implementation will use:");
console.log("- crypto.unaudited_signHash() for signing");
console.log("- crypto.unaudited_recoverAddress() for recovery");
console.log("- crypto.unaudited_verifySignature() for verification");
console.log();
console.log("Files:");
console.log("- src/crypto/hash_utils.zig - EIP-191 hash implementation");
console.log("- src/crypto/crypto.zig - Signature operations");
console.log("- src/crypto/eip712.zig - EIP-712 implementation (unaudited)");
console.log();
