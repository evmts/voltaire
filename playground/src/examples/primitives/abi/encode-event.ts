import * as ABI from "../../../primitives/ABI/index.js";

// Example: Encode ERC20 Transfer event topics
const transferTopics = ABI.Event.encodeTopics(
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
		from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		to: "0x1234567890123456789012345678901234567890",
	},
);

console.log("Transfer topics:", transferTopics);

// Example: Encode Approval event topics
const approvalTopics = ABI.Event.encodeTopics(
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
		owner: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		spender: "0x1234567890123456789012345678901234567890",
	},
);

console.log("Approval topics:", approvalTopics);

// Example: Encode event with indexed uint256
const swapTopics = ABI.Event.encodeTopics(
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
		sender: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		to: "0x1234567890123456789012345678901234567890",
	},
);

console.log("Swap topics:", swapTopics);
