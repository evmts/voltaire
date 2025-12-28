import { ABI } from "voltaire";

// Example: Calculate error selector from signature string
const unauthorizedSelector = ABI.Error.getSelector("Unauthorized()");

// Example: Calculate selector from error definition
const insufficientBalanceSelector = ABI.Error.getSelector({
	name: "InsufficientBalance",
	type: "error",
	inputs: [
		{ type: "address", name: "account" },
		{ type: "uint256", name: "balance" },
		{ type: "uint256", name: "needed" },
	],
});

// Example: Complex error with tuple
const invalidOrderSelector = ABI.Error.getSelector({
	name: "InvalidOrder",
	type: "error",
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

// Example: Error with array parameter
const invalidTokensSelector = ABI.Error.getSelector({
	name: "InvalidTokens",
	type: "error",
	inputs: [{ type: "address[]", name: "tokens" }],
});

// Example: Common ERC standard errors
const transferFailedSelector = ABI.Error.getSelector("TransferFailed()");
const approvalFailedSelector = ABI.Error.getSelector("ApprovalFailed()");
