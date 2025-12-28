import { ABI } from "voltaire";

// Example: Encode dynamic string type
const stringParams = ABI.encodeParameters(
	[
		{ type: "string", name: "message" },
		{ type: "string", name: "name" },
	],
	["Hello, Ethereum!", "Voltaire"],
);

// Example: Encode dynamic bytes type
const bytesParams = ABI.encodeParameters(
	[{ type: "bytes", name: "data" }],
	[new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])],
);

// Example: Encode dynamic array
const arrayParams = ABI.encodeParameters(
	[{ type: "uint256[]", name: "amounts" }],
	[[100n, 200n, 300n, 400n, 500n]],
);

// Example: Encode dynamic array of addresses
const addressArrayParams = ABI.encodeParameters(
	[{ type: "address[]", name: "recipients" }],
	[
		[
			"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			"0x1234567890123456789012345678901234567890",
			"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		],
	],
);

// Example: Encode mixed static and dynamic types
const mixedParams = ABI.encodeParameters(
	[
		{ type: "uint256", name: "id" },
		{ type: "string", name: "name" },
		{ type: "address", name: "owner" },
		{ type: "bytes", name: "metadata" },
	],
	[
		1n,
		"NFT #1",
		"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		new Uint8Array([0x01, 0x02, 0x03]),
	],
);

// Example: Encode nested dynamic types
const nestedParams = ABI.encodeParameters(
	[{ type: "string[]", name: "messages" }],
	[["Hello", "World", "Ethereum"]],
);
