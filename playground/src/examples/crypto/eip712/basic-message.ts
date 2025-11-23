// EIP-712: Basic typed message signing
import * as EIP712 from "../../../crypto/EIP712/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

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
console.log("Typed data hash:", Hex.fromBytes(hash).toString());
console.log("Hash length:", hash.length, "bytes");

// Domain separator binds signature to specific app + chain
const domainHash = EIP712.Domain.hash(typedData.domain);
console.log(
	"Domain separator:",
	Hex.fromBytes(domainHash).toString().slice(0, 20) + "...",
);

// Type encoding - canonical string representation
const typeEncoding = EIP712.encodeType("Message", typedData.types);
console.log("Type encoding:", typeEncoding);

// Type hash - keccak256 of type encoding
const typeHash = EIP712.hashType("Message", typedData.types);
console.log(
	"Type hash:",
	Hex.fromBytes(typeHash).toString().slice(0, 20) + "...",
);
