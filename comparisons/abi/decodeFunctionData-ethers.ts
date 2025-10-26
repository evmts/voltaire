import { Interface } from "ethers";

// Simple function: transfer(address,uint256)
const transferAbi = ["function transfer(address to, uint256 amount)"];
const transferInterface = new Interface(transferAbi);
const transferArgs = ["0x742d35cc6634c0532925a3b844bc9e7595f0beb1", 1000n];
const transferEncoded = transferInterface.encodeFunctionData(
	"transfer",
	transferArgs,
);

// Complex function: swapExactTokensForTokens
const swapAbi = [
	"function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)",
];
const swapInterface = new Interface(swapAbi);
const swapArgs = [
	1000000000000000000n,
	900000000000000000n,
	[
		"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
	],
	"0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
	1700000000n,
];
const swapEncoded = swapInterface.encodeFunctionData(
	"swapExactTokensForTokens",
	swapArgs,
);

export function main(): void {
	// Decode both simple and complex function calls
	transferInterface.decodeFunctionData("transfer", transferEncoded);
	swapInterface.decodeFunctionData("swapExactTokensForTokens", swapEncoded);
}
