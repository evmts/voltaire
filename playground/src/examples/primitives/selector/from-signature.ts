import * as Selector from "../../../primitives/Selector/index.js";

const transfer = Selector.fromSignature("transfer(address,uint256)");

const balanceOf = Selector.fromSignature("balanceOf(address)");

const totalSupply = Selector.fromSignature("totalSupply()");

const pause = Selector.fromSignature("pause()");

const swapExactTokensForTokens = Selector.fromSignature(
	"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
);

const multicall = Selector.fromSignature("multicall(bytes[])");

const execute = Selector.fromSignature(
	"execute(address,uint256,bytes,uint8,bytes32,bytes32)",
);

const correctSel = Selector.fromSignature("approve(address,uint256)");

const noSpacesSel = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);

const safeTransferFrom3 = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256)",
);
const safeTransferFrom4 = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256,bytes)",
);

// Structs are represented as tuples
const fillOrder = Selector.fromSignature(
	"fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)",
);
