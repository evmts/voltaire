import { ABI } from "voltaire";

// Example: Encode basic types
const basicParams = ABI.encodeParameters(
	[
		{ type: "uint256", name: "amount" },
		{ type: "address", name: "recipient" },
		{ type: "bool", name: "success" },
	],
	[1000n, "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", true],
);

// Example: Encode array types
const arrayParams = ABI.encodeParameters(
	[
		{ type: "uint256[]", name: "amounts" },
		{ type: "address[]", name: "recipients" },
	],
	[
		[100n, 200n, 300n],
		[
			"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			"0x1234567890123456789012345678901234567890",
		],
	],
);

// Example: Encode fixed-size array
const fixedArrayParams = ABI.encodeParameters(
	[
		{ type: "uint256[3]", name: "values" },
		{ type: "bytes32[2]", name: "hashes" },
	],
	[
		[1n, 2n, 3n],
		[new Uint8Array(32), new Uint8Array(32)],
	],
);

// Example: Encode string and bytes
const dynamicParams = ABI.encodeParameters(
	[
		{ type: "string", name: "message" },
		{ type: "bytes", name: "data" },
	],
	["Hello, World!", new Uint8Array([1, 2, 3, 4, 5])],
);

// Example: Encode tuple
const tupleParams = ABI.encodeParameters(
	[
		{
			type: "tuple",
			name: "order",
			components: [
				{ type: "address", name: "maker" },
				{ type: "uint256", name: "amount" },
				{ type: "uint256", name: "price" },
			],
		},
	],
	[["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 1000n, 500n]],
);
