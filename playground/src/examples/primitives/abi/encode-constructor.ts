import * as ABI from "../../../primitives/ABI/index.js";

// Example: Encode constructor with basic parameters
const basicConstructor = ABI.Constructor.encodeParams(
	{
		type: "constructor",
		inputs: [
			{ type: "string", name: "name" },
			{ type: "string", name: "symbol" },
			{ type: "uint8", name: "decimals" },
		],
	},
	["MyToken", "MTK", 18],
);

// Example: Encode constructor with address and uint256
const tokenConstructor = ABI.Constructor.encodeParams(
	{
		type: "constructor",
		inputs: [
			{ type: "address", name: "owner" },
			{ type: "uint256", name: "initialSupply" },
		],
	},
	["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 1000000000000000000000000n],
);

// Example: Encode constructor with array parameter
const multisigConstructor = ABI.Constructor.encodeParams(
	{
		type: "constructor",
		inputs: [
			{ type: "address[]", name: "owners" },
			{ type: "uint256", name: "required" },
		],
	},
	[
		[
			"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			"0x1234567890123456789012345678901234567890",
			"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		],
		2n,
	],
);

// Example: Encode constructor with tuple parameter
const complexConstructor = ABI.Constructor.encodeParams(
	{
		type: "constructor",
		inputs: [
			{
				type: "tuple",
				name: "config",
				components: [
					{ type: "address", name: "admin" },
					{ type: "uint256", name: "fee" },
					{ type: "bool", name: "paused" },
				],
			},
		],
	},
	[["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 100n, false]],
);
