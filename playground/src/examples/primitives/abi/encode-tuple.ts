import * as ABI from "../../../primitives/ABI/index.js";

// Example: Encode simple tuple
const simpleTuple = ABI.encodeParameters(
	[
		{
			type: "tuple",
			name: "user",
			components: [
				{ type: "address", name: "addr" },
				{ type: "uint256", name: "balance" },
			],
		},
	],
	[["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 1000n]],
);

console.log("Simple tuple:", simpleTuple);

// Example: Encode tuple with dynamic types
const dynamicTuple = ABI.encodeParameters(
	[
		{
			type: "tuple",
			name: "metadata",
			components: [
				{ type: "string", name: "name" },
				{ type: "string", name: "description" },
				{ type: "bytes", name: "data" },
			],
		},
	],
	[["MyNFT", "A unique NFT", new Uint8Array([1, 2, 3])]],
);

console.log("Dynamic tuple:", dynamicTuple);

// Example: Encode array of tuples
const tupleArray = ABI.encodeParameters(
	[
		{
			type: "tuple[]",
			name: "orders",
			components: [
				{ type: "address", name: "maker" },
				{ type: "uint256", name: "amount" },
				{ type: "uint256", name: "price" },
			],
		},
	],
	[
		[
			["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 100n, 50n],
			["0x1234567890123456789012345678901234567890", 200n, 100n],
		],
	],
);

console.log("Tuple array:", tupleArray);

// Example: Encode nested tuple
const nestedTuple = ABI.encodeParameters(
	[
		{
			type: "tuple",
			name: "trade",
			components: [
				{ type: "address", name: "trader" },
				{
					type: "tuple",
					name: "order",
					components: [
						{ type: "uint256", name: "amount" },
						{ type: "uint256", name: "price" },
					],
				},
			],
		},
	],
	[["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", [100n, 50n]]],
);

console.log("Nested tuple:", nestedTuple);

// Example: Encode tuple with array component
const tupleWithArray = ABI.encodeParameters(
	[
		{
			type: "tuple",
			name: "batch",
			components: [
				{ type: "address", name: "sender" },
				{ type: "address[]", name: "recipients" },
				{ type: "uint256[]", name: "amounts" },
			],
		},
	],
	[
		[
			"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			[
				"0x1234567890123456789012345678901234567890",
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			],
			[100n, 200n],
		],
	],
);

console.log("Tuple with array:", tupleWithArray);
