/**
 * Benchmark: JS vs WASM vs viem EIP-712 implementations
 * Compares performance of EIP-712 operations across different backends
 */

import { bench, run } from "mitata";
import { hashTypedData as viemHashTypedData } from "viem";
import { Address } from "../primitives/Address/index.js";
import {
	EIP712,
	type TypeDefinitions,
	type TypedData,
} from "./EIP712/index.js";
import { Eip712Wasm } from "./eip712.wasm.js";

// Initialize WASM
await Eip712Wasm.init();

// Test data setup
const privateKey = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	privateKey[i] = i + 1;
}

// Simple typed data
const simpleTypedData: TypedData = {
	domain: {
		name: "TestApp",
		version: "1",
		chainId: 1n,
	},
	types: {
		Message: [{ name: "content", type: "string" }],
	},
	primaryType: "Message",
	message: {
		content: "Hello, World!",
	},
};

// Complex Mail typed data (EIP-712 reference example)
const mailTypedData: TypedData = {
	domain: {
		name: "Ether Mail",
		version: "1",
		chainId: 1n,
		verifyingContract: Address.fromHex(
			"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
		),
	},
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
	message: {
		from: {
			name: "Cow",
			wallet: Address.fromHex("0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"),
		},
		to: {
			name: "Bob",
			wallet: Address.fromHex("0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"),
		},
		contents: "Hello, Bob!",
	},
};

// ERC-2612 Permit typed data (real-world use case)
const permitTypedData: TypedData = {
	domain: {
		name: "USD Coin",
		version: "1",
		chainId: 1n,
		verifyingContract: Address.fromHex(
			"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		),
	},
	types: {
		Permit: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		],
	},
	primaryType: "Permit",
	message: {
		owner: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
		spender: Address.fromHex("0x1234567890123456789012345678901234567890"),
		value: 1000000n,
		nonce: 0n,
		deadline: 1700000000n,
	},
};

// viem-compatible typed data (uses hex strings for addresses)
const viemSimpleTypedData = {
	domain: {
		name: "TestApp",
		version: "1",
		chainId: 1n,
	},
	types: {
		Message: [{ name: "content", type: "string" }],
	},
	primaryType: "Message" as const,
	message: {
		content: "Hello, World!",
	},
};

const viemMailTypedData = {
	domain: {
		name: "Ether Mail",
		version: "1",
		chainId: 1n,
		verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as const,
	},
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
	primaryType: "Mail" as const,
	message: {
		from: {
			name: "Cow",
			wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826" as const,
		},
		to: {
			name: "Bob",
			wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB" as const,
		},
		contents: "Hello, Bob!",
	},
};

const viemPermitTypedData = {
	domain: {
		name: "USD Coin",
		version: "1",
		chainId: 1n,
		verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
	},
	types: {
		Permit: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		],
	},
	primaryType: "Permit" as const,
	message: {
		// Use checksummed addresses for viem
		owner: "0x742d35Cc6634c0532925a3b844bc9e7595F251E3" as const,
		spender: "0x1234567890123456789012345678901234567890" as const,
		value: 1000000n,
		nonce: 0n,
		deadline: 1700000000n,
	},
};

// ============================================================================
// hashTypedData - Simple Message
// ============================================================================

bench("hashTypedData - simple - TS", () => {
	EIP712.hashTypedData(simpleTypedData);
});

bench("hashTypedData - simple - WASM", () => {
	Eip712Wasm.hashTypedData(simpleTypedData);
});

bench("hashTypedData - simple - viem", () => {
	viemHashTypedData(viemSimpleTypedData);
});

await run();

// ============================================================================
// hashTypedData - Nested Types (Mail)
// ============================================================================

bench("hashTypedData - nested - TS", () => {
	EIP712.hashTypedData(mailTypedData);
});

bench("hashTypedData - nested - WASM", () => {
	Eip712Wasm.hashTypedData(mailTypedData);
});

bench("hashTypedData - nested - viem", () => {
	viemHashTypedData(viemMailTypedData);
});

await run();

// ============================================================================
// hashTypedData - ERC-2612 Permit
// ============================================================================

bench("hashTypedData - permit - TS", () => {
	EIP712.hashTypedData(permitTypedData);
});

bench("hashTypedData - permit - WASM", () => {
	Eip712Wasm.hashTypedData(permitTypedData);
});

bench("hashTypedData - permit - viem", () => {
	viemHashTypedData(viemPermitTypedData);
});

await run();

// ============================================================================
// Domain.hash (encode domain separator)
// ============================================================================

const minimalDomain = { name: "Test" };
// Helper to create bytes32 from hex
function hexToBytes32(hex: string): Uint8Array {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

const completeDomain = {
	name: "TestDomain",
	version: "1",
	chainId: 1n,
	verifyingContract: Address.fromHex(
		"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	),
	salt: hexToBytes32(
		"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
	),
};

bench("Domain.hash - minimal - TS", () => {
	EIP712.Domain.hash(minimalDomain);
});

bench("Domain.hash - minimal - WASM", () => {
	Eip712Wasm.Domain.hash(minimalDomain);
});

await run();

bench("Domain.hash - complete - TS", () => {
	EIP712.Domain.hash(completeDomain);
});

bench("Domain.hash - complete - WASM", () => {
	Eip712Wasm.Domain.hash(completeDomain);
});

await run();

// ============================================================================
// hashStruct
// ============================================================================

const personTypes: TypeDefinitions = {
	Person: [
		{ name: "name", type: "string" },
		{ name: "wallet", type: "address" },
	],
};

const personMessage = {
	name: "Alice",
	wallet: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
};

bench("hashStruct - simple - TS", () => {
	EIP712.hashStruct("Person", personMessage, personTypes);
});

bench("hashStruct - simple - WASM", () => {
	Eip712Wasm.hashStruct("Person", personMessage, personTypes);
});

await run();

bench("hashStruct - nested - TS", () => {
	EIP712.hashStruct(
		mailTypedData.primaryType,
		mailTypedData.message,
		mailTypedData.types,
	);
});

bench("hashStruct - nested - WASM", () => {
	Eip712Wasm.hashStruct(
		mailTypedData.primaryType,
		mailTypedData.message,
		mailTypedData.types,
	);
});

await run();

// ============================================================================
// encodeType
// ============================================================================

bench("encodeType - simple - TS", () => {
	EIP712.encodeType("Person", personTypes);
});

bench("encodeType - simple - WASM", () => {
	Eip712Wasm.encodeType("Person", personTypes);
});

await run();

bench("encodeType - nested - TS", () => {
	EIP712.encodeType("Mail", mailTypedData.types);
});

bench("encodeType - nested - WASM", () => {
	Eip712Wasm.encodeType("Mail", mailTypedData.types);
});

await run();

// ============================================================================
// hashType
// ============================================================================

bench("hashType - simple - TS", () => {
	EIP712.hashType("Person", personTypes);
});

bench("hashType - simple - WASM", () => {
	Eip712Wasm.hashType("Person", personTypes);
});

await run();

bench("hashType - nested - TS", () => {
	EIP712.hashType("Mail", mailTypedData.types);
});

bench("hashType - nested - WASM", () => {
	Eip712Wasm.hashType("Mail", mailTypedData.types);
});

await run();

// ============================================================================
// encodeValue
// ============================================================================

bench("encodeValue - uint256 - TS", () => {
	EIP712.encodeValue("uint256", 1000000000000000000n, {});
});

bench("encodeValue - uint256 - WASM", () => {
	Eip712Wasm.encodeValue("uint256", 1000000000000000000n, {});
});

await run();

bench("encodeValue - address - TS", () => {
	const address = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
	EIP712.encodeValue("address", address, {});
});

bench("encodeValue - address - WASM", () => {
	const address = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
	Eip712Wasm.encodeValue("address", address, {});
});

await run();

bench("encodeValue - string - TS", () => {
	EIP712.encodeValue("string", "Hello, World!", {});
});

bench("encodeValue - string - WASM", () => {
	Eip712Wasm.encodeValue("string", "Hello, World!", {});
});

await run();

bench("encodeValue - bytes - TS", () => {
	const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
	EIP712.encodeValue("bytes", bytes, {});
});

bench("encodeValue - bytes - WASM", () => {
	const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
	Eip712Wasm.encodeValue("bytes", bytes, {});
});

await run();

// ============================================================================
// Sign + Verify (end-to-end)
// ============================================================================

bench("signTypedData - simple - TS", () => {
	EIP712.signTypedData(simpleTypedData, privateKey);
});

bench("signTypedData - simple - WASM", () => {
	Eip712Wasm.signTypedData(simpleTypedData, privateKey);
});

await run();

bench("signTypedData - permit - TS", () => {
	EIP712.signTypedData(permitTypedData, privateKey);
});

bench("signTypedData - permit - WASM", () => {
	Eip712Wasm.signTypedData(permitTypedData, privateKey);
});

await run();

// Pre-compute signatures for verification benchmarks
const tsSignature = EIP712.signTypedData(simpleTypedData, privateKey);
const wasmSignature = Eip712Wasm.signTypedData(simpleTypedData, privateKey);
const tsAddress = EIP712.recoverAddress(tsSignature, simpleTypedData);

bench("recoverAddress - TS", () => {
	EIP712.recoverAddress(tsSignature, simpleTypedData);
});

bench("recoverAddress - WASM", () => {
	Eip712Wasm.recoverAddress(wasmSignature, simpleTypedData);
});

await run();

bench("verifyTypedData - TS", () => {
	EIP712.verifyTypedData(tsSignature, simpleTypedData, tsAddress);
});

bench("verifyTypedData - WASM", () => {
	Eip712Wasm.verifyTypedData(wasmSignature, simpleTypedData, tsAddress);
});

await run();
