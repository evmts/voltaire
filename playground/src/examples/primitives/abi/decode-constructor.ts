import * as ABI from "../../../primitives/ABI/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Decode constructor with basic parameters
const basicData = Hex.fromString(
	"0x" +
		"0000000000000000000000000000000000000000000000000000000000000060" + // offset to name
		"00000000000000000000000000000000000000000000000000000000000000a0" + // offset to symbol
		"0000000000000000000000000000000000000000000000000000000000000012" + // decimals
		"0000000000000000000000000000000000000000000000000000000000000007" + // name length
		"4d79546f6b656e00000000000000000000000000000000000000000000000000" + // "MyToken"
		"0000000000000000000000000000000000000000000000000000000000000003" + // symbol length
		"4d544b0000000000000000000000000000000000000000000000000000000000", // "MTK"
);

const basicConstructor = ABI.Constructor.decodeParams(
	{
		type: "constructor",
		inputs: [
			{ type: "string", name: "name" },
			{ type: "string", name: "symbol" },
			{ type: "uint8", name: "decimals" },
		],
	},
	basicData,
);

console.log("Basic constructor params:", basicConstructor);

// Example: Decode constructor with address and uint256
const tokenData = Hex.fromString(
	"0x" +
		"000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e" +
		"00000000000000000000000000000000000000000000d3c21bcecceda1000000",
);

const tokenConstructor = ABI.Constructor.decodeParams(
	{
		type: "constructor",
		inputs: [
			{ type: "address", name: "owner" },
			{ type: "uint256", name: "initialSupply" },
		],
	},
	tokenData,
);

console.log("Token constructor params:", tokenConstructor);
