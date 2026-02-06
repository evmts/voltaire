import { TypedData, Address, ChainId, Keccak256 } from "@tevm/voltaire";

// TypedData: EIP-712 Typed Data for structured signing
// Used for gasless transactions, permits, and secure message signing

// Define typed data structure for a permit
const permitData = TypedData.from({
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
		name: "MyToken",
		version: "1",
		chainId: ChainId(1n),
		verifyingContract: Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
	},
	message: {
		owner: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		spender: "0x1234567890123456789012345678901234567890",
		value: "1000000000",
		nonce: "0",
		deadline: "1735689600",
	},
});

// Validate the typed data structure
TypedData.validate(permitData);
console.log("Typed data is valid");

// Hash for signing (requires keccak256)
const crypto = { keccak256: Keccak256.hash };
const hash = TypedData.hash(permitData, crypto);
console.log("Hash for signing:", Buffer.from(hash).toString("hex"));

// Encode for verification
const encoded = TypedData.encode(permitData, crypto);
console.log("Encoded length:", encoded.length, "bytes");

// Example: NFT marketplace order
const orderData = TypedData.from({
	types: {
		EIP712Domain: [
			{ name: "name", type: "string" },
			{ name: "version", type: "string" },
			{ name: "chainId", type: "uint256" },
			{ name: "verifyingContract", type: "address" },
		],
		Order: [
			{ name: "maker", type: "address" },
			{ name: "taker", type: "address" },
			{ name: "tokenId", type: "uint256" },
			{ name: "price", type: "uint256" },
			{ name: "expiry", type: "uint256" },
		],
	},
	primaryType: "Order",
	domain: {
		name: "NFTMarketplace",
		version: "1",
		chainId: 1,
		verifyingContract: "0x0000000000000000000000000000000000000001",
	},
	message: {
		maker: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		taker: "0x0000000000000000000000000000000000000000",
		tokenId: "1234",
		price: "1000000000000000000",
		expiry: "1735689600",
	},
});

console.log("Order typed data created");
