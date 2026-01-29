/**
 * TypedData (EIP-712) Benchmarks - mitata format
 * Compares voltaire TypedData module vs viem hashTypedData
 */

import { bench, run } from "mitata";
import { hashTypedData as viemHashTypedData } from "viem";
import { keccak256 } from "../../crypto/keccak256/index.js";
import * as TypedData from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

const crypto = { keccak256 };

// Simple message typed data
const simpleTypedData = {
	types: {
		EIP712Domain: [
			{ name: "name", type: "string" },
			{ name: "version", type: "string" },
			{ name: "chainId", type: "uint256" },
		],
		Message: [{ name: "content", type: "string" }],
	},
	primaryType: "Message",
	domain: {
		name: "TestApp",
		version: "1",
		chainId: 1,
	},
	message: {
		content: "Hello, World!",
	},
};

// EIP-712 Mail example (nested types)
const mailTypedData = {
	types: {
		EIP712Domain: [
			{ name: "name", type: "string" },
			{ name: "version", type: "string" },
			{ name: "chainId", type: "uint256" },
			{ name: "verifyingContract", type: "address" },
		],
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
		verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
	},
	message: {
		from: {
			name: "Cow",
			wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
		},
		to: {
			name: "Bob",
			wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
		},
		contents: "Hello, Bob!",
	},
};

// ERC-2612 Permit typed data
const permitTypedData = {
	types: {
		EIP712Domain: [
			{ name: "name", type: "string" },
			{ name: "version", type: "string" },
			{ name: "chainId", type: "uint256" },
			{ name: "verifyingContract", type: "address" },
		],
		Permit: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		],
	},
	primaryType: "Permit",
	domain: {
		name: "USD Coin",
		version: "1",
		chainId: 1,
		verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	},
	message: {
		owner: "0x742d35Cc6634c0532925a3b844bc9e7595F251E3",
		spender: "0x1234567890123456789012345678901234567890",
		value: 1000000n,
		nonce: 0n,
		deadline: 1700000000n,
	},
};

// Viem-compatible format (different message format)
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
		owner: "0x742d35Cc6634c0532925a3b844bc9e7595F251E3" as const,
		spender: "0x1234567890123456789012345678901234567890" as const,
		value: 1000000n,
		nonce: 0n,
		deadline: 1700000000n,
	},
};

// Pre-create TypedData instances
const simpleInstance = TypedData.from(simpleTypedData);
const mailInstance = TypedData.from(mailTypedData);
const permitInstance = TypedData.from(permitTypedData);

// ============================================================================
// TypedData.from - construction
// ============================================================================

bench("TypedData.from - simple - voltaire", () => {
	TypedData.from(simpleTypedData);
});

bench("TypedData.from - mail - voltaire", () => {
	TypedData.from(mailTypedData);
});

bench("TypedData.from - permit - voltaire", () => {
	TypedData.from(permitTypedData);
});

await run();

// ============================================================================
// TypedData.hash - simple message
// ============================================================================

bench("TypedData.hash - simple - voltaire", () => {
	TypedData.hash(simpleInstance, crypto);
});

bench("hashTypedData - simple - viem", () => {
	viemHashTypedData(viemSimpleTypedData);
});

await run();

// ============================================================================
// TypedData.hash - nested types (Mail)
// ============================================================================

bench("TypedData.hash - mail - voltaire", () => {
	TypedData.hash(mailInstance, crypto);
});

bench("hashTypedData - mail - viem", () => {
	viemHashTypedData(viemMailTypedData);
});

await run();

// ============================================================================
// TypedData.hash - ERC-2612 Permit
// ============================================================================

bench("TypedData.hash - permit - voltaire", () => {
	TypedData.hash(permitInstance, crypto);
});

bench("hashTypedData - permit - viem", () => {
	viemHashTypedData(viemPermitTypedData);
});

await run();

// ============================================================================
// TypedData.encode - raw encoding
// ============================================================================

bench("TypedData.encode - simple - voltaire", () => {
	TypedData.encode(simpleInstance, crypto);
});

bench("TypedData.encode - mail - voltaire", () => {
	TypedData.encode(mailInstance, crypto);
});

bench("TypedData.encode - permit - voltaire", () => {
	TypedData.encode(permitInstance, crypto);
});

await run();

// ============================================================================
// TypedData.validate
// ============================================================================

bench("TypedData.validate - simple - voltaire", () => {
	TypedData.validate(simpleInstance);
});

bench("TypedData.validate - mail - voltaire", () => {
	TypedData.validate(mailInstance);
});

bench("TypedData.validate - permit - voltaire", () => {
	TypedData.validate(permitInstance);
});

await run();

// ============================================================================
// Round-trip: from + hash
// ============================================================================

bench("roundtrip (from+hash) - simple - voltaire", () => {
	const td = TypedData.from(simpleTypedData);
	TypedData.hash(td, crypto);
});

bench("roundtrip (from+hash) - mail - voltaire", () => {
	const td = TypedData.from(mailTypedData);
	TypedData.hash(td, crypto);
});

bench("roundtrip (from+hash) - permit - voltaire", () => {
	const td = TypedData.from(permitTypedData);
	TypedData.hash(td, crypto);
});

await run();
