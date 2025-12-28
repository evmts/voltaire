import { ABI } from "voltaire";
import { Hex } from "voltaire";

// Example: Decode ERC20 Transfer event log
const transferLog = ABI.Event.decodeLog(
	{
		name: "Transfer",
		type: "event",
		inputs: [
			{ type: "address", name: "from", indexed: true },
			{ type: "address", name: "to", indexed: true },
			{ type: "uint256", name: "value", indexed: false },
		],
	},
	{
		topics: [
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
			"0x0000000000000000000000001234567890123456789012345678901234567890",
		],
		data: Hex.fromString(
			"0x0000000000000000000000000000000000000000000000000000000000000064",
		),
	},
);

// Example: Decode Approval event
const approvalLog = ABI.Event.decodeLog(
	{
		name: "Approval",
		type: "event",
		inputs: [
			{ type: "address", name: "owner", indexed: true },
			{ type: "address", name: "spender", indexed: true },
			{ type: "uint256", name: "value", indexed: false },
		],
	},
	{
		topics: [
			"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
			"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
			"0x0000000000000000000000001234567890123456789012345678901234567890",
		],
		data: Hex.fromString(
			"0x00000000000000000000000000000000000000000000003635c9adc5dea00000",
		),
	},
);

// Example: Decode Swap event with multiple non-indexed parameters
const swapLog = ABI.Event.decodeLog(
	{
		name: "Swap",
		type: "event",
		inputs: [
			{ type: "address", name: "sender", indexed: true },
			{ type: "uint256", name: "amount0In", indexed: false },
			{ type: "uint256", name: "amount1In", indexed: false },
			{ type: "uint256", name: "amount0Out", indexed: false },
			{ type: "uint256", name: "amount1Out", indexed: false },
			{ type: "address", name: "to", indexed: true },
		],
	},
	{
		topics: [
			"0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
			"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
			"0x0000000000000000000000001234567890123456789012345678901234567890",
		],
		data: Hex.fromString(
			"0x" +
				"0000000000000000000000000000000000000000000000000de0b6b3a7640000" +
				"0000000000000000000000000000000000000000000000000000000000000000" +
				"0000000000000000000000000000000000000000000000000000000000000000" +
				"00000000000000000000000000000000000000000000003635c9adc5dea00000",
		),
	},
);
