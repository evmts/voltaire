import { encodeFunctionData, decodeFunctionData } from "viem";

// Simple function: transfer(address,uint256)
const transferAbi = [
	{
		name: "transfer",
		type: "function",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
] as const;
const transferArgs = {
	to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb1" as `0x${string}`,
	amount: 1000n,
};
const transferEncoded = encodeFunctionData({
	abi: transferAbi,
	functionName: "transfer",
	args: [transferArgs.to, transferArgs.amount],
});

// Complex function: swapExactTokensForTokens
const swapAbi = [
	{
		name: "swapExactTokensForTokens",
		type: "function",
		inputs: [
			{ name: "amountIn", type: "uint256" },
			{ name: "amountOutMin", type: "uint256" },
			{ name: "path", type: "address[]" },
			{ name: "to", type: "address" },
			{ name: "deadline", type: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
] as const;
const swapArgs = {
	amountIn: 1000000000000000000n,
	amountOutMin: 900000000000000000n,
	path: [
		"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
	] as `0x${string}`[],
	to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb1" as `0x${string}`,
	deadline: 1700000000n,
};
const swapEncoded = encodeFunctionData({
	abi: swapAbi,
	functionName: "swapExactTokensForTokens",
	args: [
		swapArgs.amountIn,
		swapArgs.amountOutMin,
		swapArgs.path,
		swapArgs.to,
		swapArgs.deadline,
	],
});

export function main(): void {
	// Decode both simple and complex function calls
	decodeFunctionData({
		abi: transferAbi,
		data: transferEncoded,
	});
	decodeFunctionData({
		abi: swapAbi,
		data: swapEncoded,
	});
}
