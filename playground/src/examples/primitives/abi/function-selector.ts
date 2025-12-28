import { ABI } from "voltaire";

// Example: Calculate function selector from signature string
const transferSelector = ABI.Function.getSelector("transfer(address,uint256)");

// Example: Calculate selector from function definition
const approveSelector = ABI.Function.getSelector({
	name: "approve",
	type: "function",
	inputs: [
		{ type: "address", name: "spender" },
		{ type: "uint256", name: "value" },
	],
});

// Example: Complex function with multiple parameters
const swapSelector = ABI.Function.getSelector({
	name: "swapExactTokensForTokens",
	type: "function",
	inputs: [
		{ type: "uint256", name: "amountIn" },
		{ type: "uint256", name: "amountOutMin" },
		{ type: "address[]", name: "path" },
		{ type: "address", name: "to" },
		{ type: "uint256", name: "deadline" },
	],
});

// Example: Function with tuple parameter
const executeSelector = ABI.Function.getSelector({
	name: "execute",
	type: "function",
	inputs: [
		{
			type: "tuple",
			name: "order",
			components: [
				{ type: "address", name: "maker" },
				{ type: "address", name: "taker" },
				{ type: "uint256", name: "amount" },
			],
		},
	],
});

// Example: Common ERC20 selectors
const balanceOfSelector = ABI.Function.getSelector("balanceOf(address)");
const transferFromSelector = ABI.Function.getSelector(
	"transferFrom(address,address,uint256)",
);
const allowanceSelector = ABI.Function.getSelector(
	"allowance(address,address)",
);
