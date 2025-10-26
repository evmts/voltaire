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
	type TypedData,
	type TypedDataDomain,
	hashDomain,
	hashMessage,
	hashTypedData,
} from "../src/crypto/index.ts";

// Example 1: Hash a simple text message
const message1 = "Hello, Ethereum!";
const hash1 = hashMessage(message1);

// Example 2: Hash a message from bytes
const message2 = new TextEncoder().encode("Sign this message");
const hash2 = hashMessage(message2);

// Example 3: Demonstrate deterministic hashing
const message3 = "Deterministic test";
const hash3a = hashMessage(message3);
const hash3b = hashMessage(message3);

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

// Example 7: Domain separator hashing
const domain: TypedDataDomain = {
	name: "My Application",
	version: "1.0.0",
	chainId: 1,
	verifyingContract:
		"0x1234567890123456789012345678901234567890" as `0x${string}`,
};

const domainHash = hashDomain(domain);

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
