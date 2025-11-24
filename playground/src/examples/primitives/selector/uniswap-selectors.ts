import * as Selector from "../../../primitives/Selector/index.js";

// Example: Uniswap V2 and V3 router function selectors

console.log("=== Uniswap V2 Router Selectors ===\n");

console.log("--- Token Swaps ---\n");

const swapExactTokensForTokens = Selector.fromSignature(
	"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
);
console.log(`swapExactTokensForTokens`);
console.log(`  ${Selector.toHex(swapExactTokensForTokens)}`);
console.log(`  Input exact tokens, receive minimum tokens\n`);

const swapTokensForExactTokens = Selector.fromSignature(
	"swapTokensForExactTokens(uint256,uint256,address[],address,uint256)",
);
console.log(`swapTokensForExactTokens`);
console.log(`  ${Selector.toHex(swapTokensForExactTokens)}`);
console.log(`  Input maximum tokens, receive exact tokens\n`);

const swapExactETHForTokens = Selector.fromSignature(
	"swapExactETHForTokens(uint256,address[],address,uint256)",
);
console.log(`swapExactETHForTokens`);
console.log(`  ${Selector.toHex(swapExactETHForTokens)}`);
console.log(`  Input exact ETH, receive minimum tokens\n`);

const swapTokensForExactETH = Selector.fromSignature(
	"swapTokensForExactETH(uint256,uint256,address[],address,uint256)",
);
console.log(`swapTokensForExactETH`);
console.log(`  ${Selector.toHex(swapTokensForExactETH)}`);
console.log(`  Input maximum tokens, receive exact ETH\n`);

const swapExactTokensForETH = Selector.fromSignature(
	"swapExactTokensForETH(uint256,uint256,address[],address,uint256)",
);
console.log(`swapExactTokensForETH`);
console.log(`  ${Selector.toHex(swapExactTokensForETH)}`);
console.log(`  Input exact tokens, receive minimum ETH\n`);

const swapETHForExactTokens = Selector.fromSignature(
	"swapETHForExactTokens(uint256,address[],address,uint256)",
);
console.log(`swapETHForExactTokens`);
console.log(`  ${Selector.toHex(swapETHForExactTokens)}`);
console.log(`  Input maximum ETH, receive exact tokens\n`);

console.log("--- Swaps Supporting Fee-on-Transfer Tokens ---\n");

const swapExactTokensForTokensSupportingFeeOnTransferTokens =
	Selector.fromSignature(
		"swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)",
	);
console.log(`swapExactTokensForTokensSupportingFeeOnTransferTokens`);
console.log(
	`  ${Selector.toHex(swapExactTokensForTokensSupportingFeeOnTransferTokens)}`,
);
console.log(`  For tokens with transfer fees\n`);

console.log("--- Liquidity Management ---\n");

const addLiquidity = Selector.fromSignature(
	"addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
);
console.log(`addLiquidity`);
console.log(`  ${Selector.toHex(addLiquidity)}`);
console.log(`  Add liquidity to token/token pair\n`);

const addLiquidityETH = Selector.fromSignature(
	"addLiquidityETH(address,uint256,uint256,uint256,address,uint256)",
);
console.log(`addLiquidityETH`);
console.log(`  ${Selector.toHex(addLiquidityETH)}`);
console.log(`  Add liquidity to token/ETH pair\n`);

const removeLiquidity = Selector.fromSignature(
	"removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
);
console.log(`removeLiquidity`);
console.log(`  ${Selector.toHex(removeLiquidity)}`);
console.log(`  Remove liquidity from token/token pair\n`);

const removeLiquidityETH = Selector.fromSignature(
	"removeLiquidityETH(address,uint256,uint256,uint256,address,uint256)",
);
console.log(`removeLiquidityETH`);
console.log(`  ${Selector.toHex(removeLiquidityETH)}`);
console.log(`  Remove liquidity from token/ETH pair\n`);

console.log("--- Liquidity with Permit (EIP-2612) ---\n");

const removeLiquidityWithPermit = Selector.fromSignature(
	"removeLiquidityWithPermit(address,address,uint256,uint256,uint256,address,uint256,bool,uint8,bytes32,bytes32)",
);
console.log(`removeLiquidityWithPermit`);
console.log(`  ${Selector.toHex(removeLiquidityWithPermit)}`);
console.log(`  Remove liquidity using permit signature\n`);

console.log("=== Uniswap V3 Router Selectors ===\n");

console.log("--- V3 Swap Functions ---\n");

const exactInputSingle = Selector.fromSignature(
	"exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
);
console.log(`exactInputSingle`);
console.log(`  ${Selector.toHex(exactInputSingle)}`);
console.log(`  Single-pool exact input swap\n`);

const exactInput = Selector.fromSignature(
	"exactInput((bytes,address,uint256,uint256,uint256))",
);
console.log(`exactInput`);
console.log(`  ${Selector.toHex(exactInput)}`);
console.log(`  Multi-pool exact input swap\n`);

const exactOutputSingle = Selector.fromSignature(
	"exactOutputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
);
console.log(`exactOutputSingle`);
console.log(`  ${Selector.toHex(exactOutputSingle)}`);
console.log(`  Single-pool exact output swap\n`);

const exactOutput = Selector.fromSignature(
	"exactOutput((bytes,address,uint256,uint256,uint256))",
);
console.log(`exactOutput`);
console.log(`  ${Selector.toHex(exactOutput)}`);
console.log(`  Multi-pool exact output swap\n`);

console.log("--- V3 Multicall ---\n");

const multicall = Selector.fromSignature("multicall(bytes[])");
console.log(`multicall`);
console.log(`  ${Selector.toHex(multicall)}`);
console.log(`  Batch multiple operations\n`);

const multicallWithDeadline = Selector.fromSignature(
	"multicall(uint256,bytes[])",
);
console.log(`multicall (with deadline)`);
console.log(`  ${Selector.toHex(multicallWithDeadline)}`);
console.log(`  Batch with deadline parameter\n`);

console.log("=== Uniswap V2 Pair Selectors ===\n");

const swap = Selector.fromSignature("swap(uint256,uint256,address,bytes)");
console.log(`swap (V2 Pair)`);
console.log(`  ${Selector.toHex(swap)}`);
console.log(`  Low-level swap on pair contract\n`);

const mint = Selector.fromSignature("mint(address)");
console.log(`mint (V2 Pair)`);
console.log(`  ${Selector.toHex(mint)}`);
console.log(`  Mint LP tokens\n`);

const burn = Selector.fromSignature("burn(address)");
console.log(`burn (V2 Pair)`);
console.log(`  ${Selector.toHex(burn)}`);
console.log(`  Burn LP tokens\n`);

const skim = Selector.fromSignature("skim(address)");
console.log(`skim (V2 Pair)`);
console.log(`  ${Selector.toHex(skim)}`);
console.log(`  Force balances to match reserves\n`);

const sync = Selector.fromSignature("sync()");
console.log(`sync (V2 Pair)`);
console.log(`  ${Selector.toHex(sync)}`);
console.log(`  Force reserves to match balances\n`);
