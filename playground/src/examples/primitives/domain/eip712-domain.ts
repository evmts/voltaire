import { hash as keccak256 } from "voltaire";
import { Domain, Hex } from "voltaire";

// Example: EIP-712 domain separator usage for typed data signing

// EIP-712 domain for a decentralized exchange
const dexDomain = Domain.from({
	name: "DecentralizedExchange",
	version: "1.0.0",
	chainId: 1,
	verifyingContract: "0x1234567890123456789012345678901234567890",
});

// Get the type definition for this domain
const domainType = Domain.getEIP712DomainType(dexDomain);

// Compute domain separator
const domainSeparator = Domain.toHash(dexDomain, { keccak256 });

// Example: EIP-712 types for Order struct
const types = {
	Order: [
		{ name: "maker", type: "address" },
		{ name: "taker", type: "address" },
		{ name: "makerAsset", type: "address" },
		{ name: "takerAsset", type: "address" },
		{ name: "makerAmount", type: "uint256" },
		{ name: "takerAmount", type: "uint256" },
		{ name: "expiration", type: "uint256" },
	],
};

// Encode the Order type string
const orderTypeString = Domain.encodeType("Order", types);

// Hash the type
const orderTypeHash = Domain.hashType("Order", types, { keccak256 });

// Example order data
const order = {
	maker: "0x1234567890123456789012345678901234567890",
	taker: "0x0000000000000000000000000000000000000000",
	makerAsset: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	takerAsset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
	makerAmount: "1000000000",
	takerAmount: "500000000000000000",
	expiration: "1735689600",
};

// Encode order data
const encodedOrder = Domain.encodeData("Order", order, types, { keccak256 });
