import * as ABI from "../../../primitives/ABI/index.js";

// Example: Format function signature
const transferSig = ABI.Function.getSignature({
	name: "transfer",
	type: "function",
	inputs: [
		{ type: "address", name: "to" },
		{ type: "uint256", name: "amount" },
	],
});

console.log("Function signature:", transferSig);

// Example: Format event signature
const approvalSig = ABI.Event.getSignature({
	name: "Approval",
	type: "event",
	inputs: [
		{ type: "address", name: "owner", indexed: true },
		{ type: "address", name: "spender", indexed: true },
		{ type: "uint256", name: "value", indexed: false },
	],
});

console.log("Event signature:", approvalSig);

// Example: Format error signature
const errorSig = ABI.Error.getSignature({
	name: "InsufficientBalance",
	type: "error",
	inputs: [
		{ type: "address", name: "account" },
		{ type: "uint256", name: "balance" },
		{ type: "uint256", name: "needed" },
	],
});

console.log("Error signature:", errorSig);

// Example: Format complex function with tuple
const executeSig = ABI.Function.getSignature({
	name: "execute",
	type: "function",
	inputs: [
		{
			type: "tuple",
			name: "order",
			components: [
				{ type: "address", name: "maker" },
				{ type: "uint256", name: "amount" },
			],
		},
	],
});

console.log("Complex function signature:", executeSig);

// Example: Format function with array
const batchTransferSig = ABI.Function.getSignature({
	name: "batchTransfer",
	type: "function",
	inputs: [
		{ type: "address[]", name: "recipients" },
		{ type: "uint256[]", name: "amounts" },
	],
});

console.log("Batch transfer signature:", batchTransferSig);
