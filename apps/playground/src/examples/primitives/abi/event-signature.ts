import { ABI } from "@tevm/voltaire";

// Example: Calculate event signature (topic0) from signature string
const transferSignature = ABI.Event.getSelector(
	"Transfer(address,address,uint256)",
);

// Example: Calculate signature from event definition
const approvalSignature = ABI.Event.getSelector({
	name: "Approval",
	type: "event",
	inputs: [
		{ type: "address", name: "owner", indexed: true },
		{ type: "address", name: "spender", indexed: true },
		{ type: "uint256", name: "value", indexed: false },
	],
});

// Example: Event with multiple indexed parameters
const swapSignature = ABI.Event.getSelector({
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
});

// Example: Event with array parameter
const depositSignature = ABI.Event.getSelector({
	name: "Deposit",
	type: "event",
	inputs: [
		{ type: "address", name: "user", indexed: true },
		{ type: "uint256[]", name: "amounts", indexed: false },
	],
});

// Example: Common ERC721 event signatures
const transferERC721 = ABI.Event.getSelector(
	"Transfer(address,address,uint256)",
);
const approvalERC721 = ABI.Event.getSelector(
	"Approval(address,address,uint256)",
);
const approvalForAll = ABI.Event.getSelector(
	"ApprovalForAll(address,address,bool)",
);
