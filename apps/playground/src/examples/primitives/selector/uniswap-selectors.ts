import { Selector } from "@tevm/voltaire";
const swapExactTokensForTokens = Selector.fromSignature(
	"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
);

const swapTokensForExactTokens = Selector.fromSignature(
	"swapTokensForExactTokens(uint256,uint256,address[],address,uint256)",
);

const swapExactETHForTokens = Selector.fromSignature(
	"swapExactETHForTokens(uint256,address[],address,uint256)",
);

const swapTokensForExactETH = Selector.fromSignature(
	"swapTokensForExactETH(uint256,uint256,address[],address,uint256)",
);

const swapExactTokensForETH = Selector.fromSignature(
	"swapExactTokensForETH(uint256,uint256,address[],address,uint256)",
);

const swapETHForExactTokens = Selector.fromSignature(
	"swapETHForExactTokens(uint256,address[],address,uint256)",
);

const swapExactTokensForTokensSupportingFeeOnTransferTokens =
	Selector.fromSignature(
		"swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)",
	);

const addLiquidity = Selector.fromSignature(
	"addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
);

const addLiquidityETH = Selector.fromSignature(
	"addLiquidityETH(address,uint256,uint256,uint256,address,uint256)",
);

const removeLiquidity = Selector.fromSignature(
	"removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
);

const removeLiquidityETH = Selector.fromSignature(
	"removeLiquidityETH(address,uint256,uint256,uint256,address,uint256)",
);

const removeLiquidityWithPermit = Selector.fromSignature(
	"removeLiquidityWithPermit(address,address,uint256,uint256,uint256,address,uint256,bool,uint8,bytes32,bytes32)",
);

const exactInputSingle = Selector.fromSignature(
	"exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
);

const exactInput = Selector.fromSignature(
	"exactInput((bytes,address,uint256,uint256,uint256))",
);

const exactOutputSingle = Selector.fromSignature(
	"exactOutputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
);

const exactOutput = Selector.fromSignature(
	"exactOutput((bytes,address,uint256,uint256,uint256))",
);

const multicall = Selector.fromSignature("multicall(bytes[])");

const multicallWithDeadline = Selector.fromSignature(
	"multicall(uint256,bytes[])",
);

const swap = Selector.fromSignature("swap(uint256,uint256,address,bytes)");

const mint = Selector.fromSignature("mint(address)");

const burn = Selector.fromSignature("burn(address)");

const skim = Selector.fromSignature("skim(address)");

const sync = Selector.fromSignature("sync()");
