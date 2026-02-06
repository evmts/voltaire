import { Address, EIP712, Hex } from "@tevm/voltaire";
// EIP-712: Basic typed message signing

// Define typed data with simple message
const typedData = {
	domain: {
		name: "MyDApp",
		version: "1",
		chainId: 1n,
	},
	types: {
		Message: [
			{ name: "content", type: "string" },
			{ name: "timestamp", type: "uint256" },
		],
	},
	primaryType: "Message",
	message: {
		content: "Hello, EIP-712!",
		timestamp: 1700000000n,
	},
};

// Hash typed data - produces 32-byte digest ready for signing
const hash = EIP712.hashTypedData(typedData);

// Domain separator binds signature to specific app + chain
const domainHash = EIP712.Domain.hash(typedData.domain);

// Type encoding - canonical string representation
const typeEncoding = EIP712.encodeType("Message", typedData.types);

// Type hash - keccak256 of type encoding
const typeHash = EIP712.hashType("Message", typedData.types);
