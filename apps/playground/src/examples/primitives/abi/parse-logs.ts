import { ABI } from "@tevm/voltaire";
import { Hex } from "@tevm/voltaire";

// Example: Parse multiple logs from a transaction
const abi = ABI.Abi([
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
		name: "Approval",
		type: "event",
		inputs: [
			{ type: "address", name: "owner", indexed: true },
			{ type: "address", name: "spender", indexed: true },
			{ type: "uint256", name: "value", indexed: false },
		],
	},
]);

const logs = [
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
];

const parsedLogs = ABI.parseLogs(abi, logs);

// Example: Parse logs with unknown events (will be skipped)
const logsWithUnknown = [
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
	{
		topics: [
			"0x0000000000000000000000000000000000000000000000000000000000000000", // unknown event
		],
		data: Hex.fromString(
			"0x0000000000000000000000000000000000000000000000000000000000000001",
		),
	},
];

const parsedWithUnknown = ABI.parseLogs(abi, logsWithUnknown);
