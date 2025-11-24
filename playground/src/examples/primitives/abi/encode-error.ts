import * as ABI from "../../../primitives/ABI/index.js";

// Example: Encode custom error without parameters
const unauthorized = ABI.Error.encodeParams({
	name: "Unauthorized",
	type: "error",
	inputs: [],
});

// Example: Encode custom error with parameters
const insufficientBalance = ABI.Error.encodeParams(
	{
		name: "InsufficientBalance",
		type: "error",
		inputs: [
			{ type: "address", name: "account" },
			{ type: "uint256", name: "balance" },
			{ type: "uint256", name: "needed" },
		],
	},
	["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 100n, 1000n],
);

// Example: Encode error with array parameter
const invalidTokens = ABI.Error.encodeParams(
	{
		name: "InvalidTokens",
		type: "error",
		inputs: [{ type: "address[]", name: "tokens" }],
	},
	[
		[
			"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
			"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		],
	],
);

// Example: Encode error with string message
const transferFailed = ABI.Error.encodeParams(
	{
		name: "TransferFailed",
		type: "error",
		inputs: [{ type: "string", name: "reason" }],
	},
	["Insufficient allowance"],
);
