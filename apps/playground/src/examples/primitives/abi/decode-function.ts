import { ABI } from "@tevm/voltaire";
import { Hex } from "@tevm/voltaire";

// Example: Decode ERC20 transfer function result
const transferReturnData = Hex.fromString(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const transferResult = ABI.Function.decodeResult(
	{
		name: "transfer",
		type: "function",
		outputs: [{ type: "bool", name: "success" }],
	},
	transferReturnData,
);

// Example: Decode balanceOf return value
const balanceData = Hex.fromString(
	"0x00000000000000000000000000000000000000000000003635c9adc5dea00000",
);
const balance = ABI.Function.decodeResult(
	{
		name: "balanceOf",
		type: "function",
		outputs: [{ type: "uint256", name: "balance" }],
	},
	balanceData,
);

// Example: Decode function with multiple return values
const getReservesData = Hex.fromString(
	"0x" +
		"00000000000000000000000000000000000000000000003635c9adc5dea00000" + // reserve0
		"0000000000000000000000000000000000000000000000000de0b6b3a7640000" + // reserve1
		"0000000000000000000000000000000000000000000000000000000065432100", // blockTimestampLast
);

const reserves = ABI.Function.decodeResult(
	{
		name: "getReserves",
		type: "function",
		outputs: [
			{ type: "uint112", name: "reserve0" },
			{ type: "uint112", name: "reserve1" },
			{ type: "uint32", name: "blockTimestampLast" },
		],
	},
	getReservesData,
);
