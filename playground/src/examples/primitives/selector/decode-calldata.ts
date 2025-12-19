import * as Selector from "../../../primitives/Selector/index.js";

const transferCalldata =
	"0xa9059cbb" + // transfer(address,uint256)
	"000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e" + // to address
	"0000000000000000000000000000000000000000000000000de0b6b3a7640000"; // amount (1 ETH)

const transferSel = Selector.from(transferCalldata.slice(0, 10)); // "0x" + 8 hex chars

const expectedTransfer = Selector.fromSignature("transfer(address,uint256)");

const approveCalldata =
	"0x095ea7b3" + // approve(address,uint256)
	"0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d" + // spender (Uniswap router)
	"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; // amount (max uint256)

const approveSel = Selector.from(approveCalldata.slice(0, 10));

const swapCalldata =
	"0x38ed1739" + // swapExactTokensForTokens
	"00000000000000000000000000000000000000000000000000038d7ea4c68000" + // amountIn
	"0000000000000000000000000000000000000000000000000000000000000001" + // amountOutMin
	"0000000000000000000000000000000000000000000000000000000000000080"; // path offset (truncated)

const swapSel = Selector.from(swapCalldata.slice(0, 10));

const expectedSwap = Selector.fromSignature(
	"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
);

const safeTransferCalldata =
	"0x42842e0e" + // safeTransferFrom(address,address,uint256)
	"000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e" + // from
	"0000000000000000000000005aaed59320b9eb3cd462ddbaefa21da757f30fbd" + // to
	"0000000000000000000000000000000000000000000000000000000000000001"; // tokenId

const nftSel = Selector.from(safeTransferCalldata.slice(0, 10));

const expectedNftTransfer = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256)",
);

function identifyFunction(calldata: string): string {
	if (calldata.length < 10) return "Invalid calldata";

	const sel = Selector.from(calldata.slice(0, 10));
	const selHex = Selector.toHex(sel);

	// Build lookup map
	const functionMap = new Map([
		[
			Selector.toHex(Selector.fromSignature("transfer(address,uint256)")),
			"transfer",
		],
		[
			Selector.toHex(Selector.fromSignature("approve(address,uint256)")),
			"approve",
		],
		[
			Selector.toHex(
				Selector.fromSignature("transferFrom(address,address,uint256)"),
			),
			"transferFrom",
		],
		[
			Selector.toHex(
				Selector.fromSignature(
					"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
				),
			),
			"swapExactTokensForTokens",
		],
		[
			Selector.toHex(
				Selector.fromSignature("safeTransferFrom(address,address,uint256)"),
			),
			"safeTransferFrom",
		],
	]);

	return functionMap.get(selHex) ?? "Unknown function";
}

const testCalls = [
	transferCalldata,
	approveCalldata,
	swapCalldata,
	safeTransferCalldata,
];

for (const calldata of testCalls) {
	const sel = Selector.from(calldata.slice(0, 10));
}

try {
	const shortCalldata = "0xabcd"; // Only 2 bytes
	Selector.from(shortCalldata);
} catch (e) {}

try {
	const emptyCalldata = "0x";
	Selector.from(emptyCalldata);
} catch (e) {}
