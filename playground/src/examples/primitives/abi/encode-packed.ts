import * as ABI from "../../../primitives/ABI/index.js";

// Example: encodePacked for signature verification
const packed1 = ABI.encodePacked(
	[{ type: "string" }, { type: "address" }, { type: "uint256" }],
	["Hello", "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 12345n],
);

console.log("Packed encoding 1:", packed1);

// Example: encodePacked for token ID generation
const tokenId = ABI.encodePacked(
	[{ type: "address" }, { type: "uint256" }],
	["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 1n],
);

console.log("Token ID packed:", tokenId);

// Example: encodePacked with multiple addresses (merkle tree leaf)
const leaf = ABI.encodePacked(
	[{ type: "address" }, { type: "address" }, { type: "uint256" }],
	[
		"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		"0x1234567890123456789012345678901234567890",
		100n,
	],
);

console.log("Merkle leaf packed:", leaf);

// Example: encodePacked with bytes
const signature = ABI.encodePacked(
	[{ type: "bytes32" }, { type: "bytes32" }, { type: "uint8" }],
	[new Uint8Array(32).fill(1), new Uint8Array(32).fill(2), 27],
);

console.log("Signature packed:", signature);

// Example: encodePacked with strings (concatenation)
const concatenated = ABI.encodePacked(
	[{ type: "string" }, { type: "string" }, { type: "string" }],
	["Hello", ", ", "World!"],
);

console.log("Concatenated strings:", concatenated);
