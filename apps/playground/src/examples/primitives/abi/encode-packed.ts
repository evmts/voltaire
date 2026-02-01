import { ABI, Bytes, Bytes32 } from "@tevm/voltaire";

// Example: encodePacked for signature verification
const packed1 = ABI.encodePacked(
	[{ type: "string" }, { type: "address" }, { type: "uint256" }],
	["Hello", "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 12345n],
);

// Example: encodePacked for token ID generation
const tokenId = ABI.encodePacked(
	[{ type: "address" }, { type: "uint256" }],
	["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 1n],
);

// Example: encodePacked with multiple addresses (merkle tree leaf)
const leaf = ABI.encodePacked(
	[{ type: "address" }, { type: "address" }, { type: "uint256" }],
	[
		"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		"0x1234567890123456789012345678901234567890",
		100n,
	],
);

// Example: encodePacked with bytes
const signature = ABI.encodePacked(
	[{ type: "bytes32" }, { type: "bytes32" }, { type: "uint8" }],
	[Bytes32.zero().fill(1), Bytes32.zero().fill(2), 27],
);

// Example: encodePacked with strings (concatenation)
const concatenated = ABI.encodePacked(
	[{ type: "string" }, { type: "string" }, { type: "string" }],
	["Hello", ", ", "World!"],
);
