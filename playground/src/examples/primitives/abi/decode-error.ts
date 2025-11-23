import * as ABI from "../../../primitives/ABI/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Decode custom error without parameters
const unauthorizedData = Hex.fromString("0x82b42900");
const unauthorized = ABI.Error.decodeParams(
	{
		name: "Unauthorized",
		type: "error",
		inputs: [],
	},
	unauthorizedData,
);

console.log("Unauthorized error params:", unauthorized);

// Example: Decode InsufficientBalance error
const insufficientBalanceData = Hex.fromString(
	"0xcf479181" + // selector
		"000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e" +
		"0000000000000000000000000000000000000000000000000000000000000064" +
		"00000000000000000000000000000000000000000000000000000000000003e8",
);

const insufficientBalance = ABI.Error.decodeParams(
	{
		name: "InsufficientBalance",
		type: "error",
		inputs: [
			{ type: "address", name: "account" },
			{ type: "uint256", name: "balance" },
			{ type: "uint256", name: "needed" },
		],
	},
	insufficientBalanceData,
);

console.log("InsufficientBalance params:", insufficientBalance);

// Example: Decode error with array parameter
const invalidTokensData = Hex.fromString(
	"0x5d5155f9" + // selector
		"0000000000000000000000000000000000000000000000000000000000000020" + // offset
		"0000000000000000000000000000000000000000000000000000000000000002" + // length
		"000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" +
		"000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
);

const invalidTokens = ABI.Error.decodeParams(
	{
		name: "InvalidTokens",
		type: "error",
		inputs: [{ type: "address[]", name: "tokens" }],
	},
	invalidTokensData,
);

console.log("InvalidTokens params:", invalidTokens);
